import { Metadata } from "next";
import MainLayout from "../../../_components/MainLayout";
import AGI_TekniskGuide from "../AGI_TekniskGuide";

export const metadata: Metadata = {
  title: "AGI Teknisk Guide | BokförCom",
  description:
    "Teknisk implementationsguide för Arbetsgivardeklaration på individnivå enligt Skatteverkets specifikation 1.1.17.1",
};

export default function TekniskGuidePage() {
  return (
    <MainLayout>
      <AGI_TekniskGuide />
    </MainLayout>
  );
}
