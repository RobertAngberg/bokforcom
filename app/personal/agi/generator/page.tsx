import { Metadata } from "next";
import MainLayout from "../../../_components/MainLayout";
import AGI_XMLGenerator from "../AGI_XMLGenerator";

export const metadata: Metadata = {
  title: "AGI XML-Generator | BokförCom",
  description:
    "Generera kompletta XML-filer för arbetsgivardeklaration enligt Skatteverkets schema 1.1.17.1",
};

export default function XMLGeneratorPage() {
  return (
    <MainLayout>
      <AGI_XMLGenerator />
    </MainLayout>
  );
}
