"use client";

import AwsS3 from "@uppy/aws-s3";
import Uppy from "@uppy/core";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FilterId, UploadSource } from "@/lib/filters";
import { allowedPhotoTypes, maxPhotoBytes } from "@/lib/upload-limits";

export type Upload = {
  id: string;
  /** Null when this browser can't show the file. */
  previewUrl: string | null;
  /** Chosen before sending, and shown on the preview too. */
  filter: FilterId;
  percent: number;
  state: "uploading" | "failed" | "confirmed";
  /** Known once the server has registered the upload. */
  mediaId?: string;
};

/** What the guest chose for a batch of photos, before sending it. */
export type UploadChoice = { filter: FilterId; source: UploadSource };

// Waits before each automatic new attempt: enough to outlast a Wi-Fi hiccup at the party.
const retryDelays = [2_000, 5_000, 10_000, 20_000, 30_000];

/** Whether this browser can show the file. Only Apple browsers decode HEIC. */
export const canPreview = (file: File) =>
  file.type !== "image/heic" && file.type !== "image/heif";

const postJson = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/** Sends photos straight to the storage, in parts, resuming where a failure stopped. */
export function useUploads(slug: string) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const uppyRef = useRef<Uppy | null>(null);
  // Attempts made so far for each upload.
  const attempts = useRef(new Map<string, number>());
  // Object keys the storage already has in full, for uploads the app hasn't confirmed yet.
  const unconfirmed = useRef(new Map<string, string>());
  // Kept apart from Uppy's metadata, which it could send to the storage as unsigned headers.
  const choices = useRef(new Map<string, UploadChoice>());

  useEffect(
    () => () => {
      uppyRef.current?.destroy();
      uppyRef.current = null;
    },
    [],
  );

  function update(id: string, changes: Partial<Upload>) {
    setUploads((current) =>
      current.map((upload) =>
        upload.id === id ? { ...upload, ...changes } : upload,
      ),
    );
  }

  /** Tries again after a while. When the attempts run out, the guest decides. */
  function retryLater(id: string, attempt: () => void) {
    const count = attempts.current.get(id) ?? 0;
    const delay = retryDelays[count];
    if (delay === undefined) {
      update(id, { state: "failed" });
      return;
    }
    attempts.current.set(id, count + 1);
    setTimeout(() => {
      if (uppyRef.current) attempt();
    }, delay);
  }

  /** The storage has the file: asks the app to check it and process it. */
  async function confirm(id: string) {
    const key = unconfirmed.current.get(id);
    if (!key) return;

    try {
      const response = await postJson(`/api/events/${slug}/uploads/complete`, {
        key,
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
    } catch {
      retryLater(id, () => confirm(id));
      return;
    }

    unconfirmed.current.delete(id);
    uppyRef.current?.removeFile(id);
    update(id, { state: "confirmed", percent: 100 });
    router.refresh();
  }

  function getUppy() {
    if (uppyRef.current) return uppyRef.current;

    const uppy = new Uppy({
      autoProceed: true,
      restrictions: {
        maxFileSize: maxPhotoBytes,
        allowedFileTypes: allowedPhotoTypes,
      },
    });

    uppy.use(AwsS3, {
      shouldUseMultipart: true,
      limit: 3,
      // Stands in for the real key, which the server picks when the upload starts.
      generateObjectKey: (file) => file.id,
      signRequest: async (request) => {
        const isStart = request.method === "POST" && !("uploadId" in request);
        const file = isStart ? uppy.getFile(request.key) : undefined;
        const response = await postJson(`/api/events/${slug}/uploads/sign`, {
          ...request,
          file: file && {
            type: file.type,
            size: file.size,
            ...choices.current.get(file.id),
          },
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const signed = await response.json();
        if (file) update(file.id, { mediaId: signed.mediaId });
        return signed;
      },
    });

    uppy.on("upload-progress", (file, { bytesUploaded, bytesTotal }) => {
      if (!file || !bytesTotal) return;
      update(file.id, {
        percent: Math.round((bytesUploaded / bytesTotal) * 100),
      });
    });
    uppy.on("upload-error", (file) => {
      if (!file) return;
      retryLater(file.id, () => uppy.retryUpload(file.id));
    });
    uppy.on("upload-success", (file, { body }) => {
      if (!file || typeof body?.key !== "string") return;
      unconfirmed.current.set(file.id, body.key);
      confirm(file.id);
    });

    uppyRef.current = uppy;
    return uppy;
  }

  /** Starts sending, with the filter chosen. Returns false if any of the files was refused. */
  function addFiles(files: File[], choice: UploadChoice) {
    const uppy = getUppy();
    const added: Upload[] = [];
    let accepted = true;

    for (const file of files) {
      const isBeingSent = uppy
        .getFiles()
        .some(({ name, size }) => name === file.name && size === file.size);
      if (isBeingSent) continue;

      try {
        const id = uppy.addFile({
          name: file.name,
          type: file.type,
          data: file,
          source: "Local",
        });
        // In time: autoProceed only starts the upload on the next tick.
        choices.current.set(id, choice);
        added.push({
          id,
          previewUrl: canPreview(file) ? URL.createObjectURL(file) : null,
          filter: choice.filter,
          percent: 0,
          state: "uploading",
        });
      } catch {
        accepted = false;
      }
    }

    setUploads((current) => [...added, ...current]);
    return accepted;
  }

  /** A new round of attempts, asked for by the guest. */
  function retry(id: string) {
    attempts.current.delete(id);
    update(id, { state: "uploading" });
    if (unconfirmed.current.has(id)) confirm(id);
    else uppyRef.current?.retryUpload(id);
  }

  return { uploads, addFiles, retry };
}
