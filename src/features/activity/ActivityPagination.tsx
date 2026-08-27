"use client";

import { Center, Pagination } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ActivityPaginationProps = Readonly<{
  currentPage: number;
  totalPages: number;
}>;

export function ActivityPagination({ currentPage, totalPages }: ActivityPaginationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  function changePage(page: number): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Center>
      <Pagination value={currentPage} total={totalPages} onChange={changePage} withEdges />
    </Center>
  );
}
