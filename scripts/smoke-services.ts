/**
 * Smoke test de la couche services contre la base seedée.
 * Usage : bun scripts/smoke-services.ts
 */
import "dotenv/config";
import { listCircuits, getCircuitBySlug } from "../lib/services/circuits";
import { listDestinations } from "../lib/services/destinations";
import { listCategories } from "../lib/services/categories";
import { listServices } from "../lib/services/services";
import { listTestimonials } from "../lib/services/testimonials";
import { listBlogPosts, listBlogCategories } from "../lib/services/blog";
import { listSettings, getAllSettings } from "../lib/services/settings";
import { createBooking, listBookings } from "../lib/services/bookings";
import { createContactRequest, listContactRequests } from "../lib/services/contact-requests";
import { getDashboardStats, getRecentBookings } from "../lib/services/stats";

async function main() {
  console.log("🧪 Smoke services Wonder Tours…");

  const circuits = await listCircuits({ page: 1, pageSize: 5, active: true });
  console.log(`✔ circuits actifs: ${circuits.total} (page 1: ${circuits.items.length})`);
  const ouidah = await getCircuitBySlug("decouverte-ouidah");
  if (!ouidah) throw new Error("Circuit decouverte-ouidah introuvable");
  console.log(`✔ circuit par slug: ${ouidah.title} — destination: ${ouidah.destination?.name} / catégories: ${ouidah.categories.map((c) => c.name).join(", ") || "—"}`);

  const filtered = await listCircuits({ destinationSlug: "ouidah" });
  console.log(`✔ filtre destination=ouidah: ${filtered.total}`);

  const destinations = await listDestinations({ active: true });
  console.log(`✔ destinations actives: ${destinations.total}`);
  const categories = await listCategories({ active: true });
  console.log(`✔ catégories actives: ${categories.total}`);
  const services = await listServices({ active: true });
  console.log(`✔ services actifs: ${services.total}`);
  const testimonials = await listTestimonials({ active: true });
  console.log(`✔ témoignages actifs: ${testimonials.total}`);
  const posts = await listBlogPosts({ published: true });
  console.log(`✔ articles publiés: ${posts.total}`);
  const blogCats = await listBlogCategories({ active: true });
  console.log(`✔ catégories blog actives: ${blogCats.total}`);

  const settingsMap = await getAllSettings();
  console.log(`✔ settings map: ${Object.keys(settingsMap).length} clés — site_name=${settingsMap["site_name"]}`);
  const settingsList = await listSettings();
  console.log(`✔ settings list: ${settingsList.length}`);

  const booking = await createBooking({
    circuitId: ouidah.id,
    customerName: "Test Client",
    customerEmail: "test@example.com",
    participants: 2,
    travelDate: new Date("2026-12-01"),
  });
  console.log(`✔ booking créé: ${booking.bookingReference} — statut: ${booking.status} — total: ${booking.totalPrice}`);
  const bookings = await listBookings({ status: "pending" });
  console.log(`✔ bookings pending: ${bookings.total}`);

  const contact = await createContactRequest({
    name: "Test Contact",
    email: "contact@example.com",
    subject: "Demande d'info",
    message: "Bonjour, je souhaite des informations.",
    requestType: "info",
  });
  console.log(`✔ demande contact créée: statut=${contact.status}`);
  const contacts = await listContactRequests({ status: "new" });
  console.log(`✔ contacts new: ${contacts.total}`);

  const stats = await getDashboardStats();
  console.log(`✔ stats — circuits: ${stats.circuits.total}, destinations: ${stats.destinations.total}, bookings: ${stats.bookings.total}, contacts: ${stats.contactRequests.total}`);
  const recent = await getRecentBookings(3);
  console.log(`✔ bookings récents: ${recent.length}`);

  console.log("🧪 Smoke services OK");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exitCode = 1;
  })
  .then(() => process.exit(process.exitCode ?? 0));
