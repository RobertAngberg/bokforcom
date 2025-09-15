"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { UseForhandsgranskningProps } from "../_types/types";

export function useForhandsgranskning({ fil, pdfUrl }: UseForhandsgranskningProps) {
  const [showModal, setShowModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize blob URL för att förhindra nya URLs varje render
  const blobUrl = useMemo(() => {
    return fil ? URL.createObjectURL(fil) : null;
  }, [fil]);

  // Cleanup blob URL när komponenten unmountar eller fil ändras
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const hasFile = fil || pdfUrl;
  const isImage = fil?.type.startsWith("image/");
  const isPdf = fil?.type === "application/pdf";
  const displayUrl = pdfUrl || blobUrl;

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleFileClick = () => {
    if (fil?.type === "application/pdf") {
      // För PDFs, öppna i ny flik
      if (blobUrl) window.open(blobUrl, "_blank");
    } else if (fil?.type.startsWith("image/")) {
      // För bilder, visa modal som vanligt
      setShowModal(true);
    } else if (pdfUrl) {
      // För andra filer, öppna uploaded URL
      window.open(pdfUrl, "_blank");
    }
  };

  const getButtonText = () => {
    if (fil?.type === "application/pdf" || (!fil?.type.startsWith("image/") && pdfUrl)) {
      return "Öppna i ny flik";
    }
    return "Visa större";
  };

  const handlePdfOpenClick = () => {
    if (blobUrl) window.open(blobUrl, "_blank");
  };

  return {
    state: {
      showModal,
      blobUrl,
      hasFile,
      isImage,
      isPdf,
      displayUrl,
    },
    actions: {
      openModal,
      closeModal,
    },
    handlers: {
      handleFileClick,
      getButtonText,
      handlePdfOpenClick,
    },
    refs: {
      iframeRef,
    },
  };
}
