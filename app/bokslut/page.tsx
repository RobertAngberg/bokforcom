import { Metadata } from "next";
import Bokslut from "./Bokslut";

export const metadata: Metadata = {
  title: "Bokslut",
  description: "Hantera årsbokslut och periodstängningar",
};

export default function BokslutPage() {
  return <Bokslut />;
}
