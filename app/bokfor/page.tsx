import MainLayout from "../_components/MainLayout";
import { PageProps } from "./_types/types";
import BokforClient from "./_components/BokforClient";
import { useBokforServerData } from "./_hooks/useBokforServerData";

export default async function Page({ searchParams }: PageProps) {
  const { initialData } = await useBokforServerData(searchParams);

  return (
    <MainLayout>
      <BokforClient initialData={initialData} />
    </MainLayout>
  );
}
