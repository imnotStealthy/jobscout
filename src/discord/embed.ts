import { EmbedBuilder } from "discord.js";
import { FtOffer, offerOriginUrl } from "../ftClient.js";

export function offerEmbed(o: FtOffer): EmbedBuilder {
  const url = offerOriginUrl(o);
  const e = new EmbedBuilder()
    .setTitle(o.intitule?.slice(0, 256) || "Offre d'emploi")
    .setColor(0x2b6cb0);
  if (url) e.setURL(url);
  if (o.entreprise?.nom) e.addFields({ name: "Entreprise", value: o.entreprise.nom, inline: true });
  if (o.lieuTravail?.libelle) e.addFields({ name: "Lieu", value: o.lieuTravail.libelle, inline: true });
  const contrat = o.typeContratLibelle ?? o.typeContrat;
  if (contrat) e.addFields({ name: "Contrat", value: contrat, inline: true });
  if (o.dateCreation) e.addFields({ name: "Publiée le", value: o.dateCreation.slice(0, 10), inline: true });
  return e;
}
