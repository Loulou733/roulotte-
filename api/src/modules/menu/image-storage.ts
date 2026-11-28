//là où on range les photos des plats  une interface pour pouvoir mettre un faux dans les tests
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
const FOLDER = "uploads/dishes";
export interface ImageStorage {
  save(fileName: string, content: Buffer): Promise<string>;
  remove(imageUrl: string): Promise<void>;
}
export class DiskImageStorage implements ImageStorage {
  //écrit le fichier dans uploads/dishes et renvoie son adresse publique
  async save(fileName: string, content: Buffer) {
    await mkdir(FOLDER, { recursive: true });
    await writeFile(join(FOLDER, fileName), content);
    return "/uploads/dishes/" + fileName;
  }
  //basename garde juste le nom du fichier donc on peut jamais sortir du dossier
  async remove(imageUrl: string) {
    await rm(join(FOLDER, basename(imageUrl)), { force: true });
  }
}
