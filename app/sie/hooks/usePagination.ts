/**
 * Hook för generisk paginering
 *
 * Hanterar:
 * - Current page state
 * - Paginering av data
 * - Total pages beräkning
 * - Navigation mellan sidor
 */

"use client";

import { useState } from "react";

export function usePagination<T = unknown>(itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const getPaginatedData = (data: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    itemsPerPage,
    getPaginatedData,
    getTotalPages,
    goToPage,
    resetPage,
  };
}
