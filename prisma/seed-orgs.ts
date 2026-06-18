import { prisma } from "../lib/db";

async function main() {
  const orgs = [
    { name: "Escuela Dominical", description: "Clases para adultos y jóvenes, 1er y 3er domingo." },
    { name: "Sociedad de Socorro", description: "Organización de mujeres adultas, 2do y 4to domingo." },
    { name: "Quórum de Élderes", description: "Organización de hombres adultos, 2do y 4to domingo." },
    { name: "Primaria", description: "Clases para niños de 18 meses a 11 años, cada domingo." },
    { name: "Mujeres Jóvenes", description: "Organización de mujeres jóvenes de 12 a 18 años, 2do y 4to domingo." },
    { name: "Sacerdocio Aarónico", description: "Quórumes de hombres jóvenes de 12 a 18 años, 2do y 4to domingo." }
  ];

  console.log("Seeding organizations...");

  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { name: org.name },
      update: {},
      create: org,
    });
  }

  console.log("Organizations seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
