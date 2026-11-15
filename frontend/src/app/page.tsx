import { redirect } from "next/navigation";

export default function HomePage() {
  // Gospodski preusmeravamo svakog posetioca direktno na na smirujuci login ekran
  redirect("/login");
}
