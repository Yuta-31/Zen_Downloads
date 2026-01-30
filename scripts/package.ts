import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Manifest {
  version: string;
  [key: string]: unknown;
}

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

async function packageExtension(): Promise<void> {
  const rootDir = path.resolve(__dirname, "..");
  const manifestPath = path.join(rootDir, "public", "manifest.json");
  const packageJsonPath = path.join(rootDir, "package.json");
  const distDir = path.join(rootDir, "dist");
  const appPackagesDir = path.join(rootDir, "appPackages");

  // Read package.json to get the source of truth for version
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf-8"),
  );
  const version = packageJson.version;

  // Sync version to manifest.json
  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  if (manifest.version !== version) {
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`✓ Synced manifest.json version to ${version}`);
  }

  // If appPackages directory doesn't exist, create it
  if (!fs.existsSync(appPackagesDir)) {
    fs.mkdirSync(appPackagesDir, { recursive: true });
  }

  const zipFileName = `appPackage-v${version}.zip`;
  const zipFilePath = path.join(appPackagesDir, zipFileName);

  try {
    // If the ZIP file already exists, remove it
    if (fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
      console.log(`Removed existing ${zipFileName}`);
    }

    // Copy license files to dist directory
    const licenseFiles = ["LICENSE", "THIRD-PARTY-NOTICES.md"];
    licenseFiles.forEach((file) => {
      const srcPath = path.join(rootDir, file);
      const destPath = path.join(distDir, file);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${file} to dist`);
      } else {
        console.warn(`⚠ ${file} not found, skipping...`);
      }
    });

    // create ZIP using PowerShell Compress-Archive
    const command = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipFilePath}" -Force`;
    execSync(command, { stdio: "inherit", shell: "powershell.exe" });

    console.log(`✓ Successfully packaged: ${zipFileName}`);
    console.log(`  Location: ${zipFilePath}`);
  } catch (error) {
    console.error("Error creating package:", error);
    process.exit(1);
  }
}

packageExtension();
