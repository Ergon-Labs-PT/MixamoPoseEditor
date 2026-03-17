# Tripo3D to Mixamo Pipeline Guide

A step-by-step guide for generating 3D characters on [Tripo3D](https://www.tripo3d.ai/), preparing them in Blender, and rigging them in Mixamo for use in this project.

---

## 1. Generate the Model in Tripo3D

1. Go to [Tripo3D](https://www.tripo3d.ai/) and generate your character
2. Use the **text prompt** tab (pencil icon) for best control

### Prompt Tips

Your prompt should describe the character AND explicitly state the pose and constraints. Always include:

- **Nothing in hands** — props and accessories confuse Mixamo's auto-rigger
- **Feet straight on the floor, pointing forward** — not sideways, not angled
- **Legs straight and together** — legs should be parallel and close together, not spread apart
- **T-Pose** — arms straight out to the sides, palms down
- **No props or accessories** that extend the silhouette

Example prompt:
> Athletic tall female sprint kayaker, surfer looks, light brown hair, small frameless sport wraparound sunglasses with clear lenses, tight white sleeveless water tank top with a thin colored stripe on the sides, black water lycra shorts. Nothing in hand. Legs straight and together. Bare feet flat on the floor pointing forward. T-Pose standing straight.

### Generation Settings

| Setting | Value | Why |
|---------|-------|-----|
| **HD Model** or **Smart Mesh** | Either works | Smart Mesh has built-in topology controls |
| **Mesh Quality** | Standard | Ultra generates too many polygons for Mixamo |
| **Generate in Parts** | Off | Mixamo needs a single continuous mesh |
| **Texture** | On | Preserves appearance through the pipeline |
| **4K Texture** | Optional | 1K-2K is usually enough, 4K makes files larger |
| **PBR** | Off | Mixamo only uses base color; extra maps can cause issues |
| **Topology → Smart Low Poly** | Off (use Retopo tab instead) | More control over polygon count in the Retopo step |
| **Topology → Triangle** | Triangle or Quad | Both work; Quad is better for deformation |
| **Polycount** | 50000-100000 | Higher than 200K will fail in Mixamo |
| **AI Model** | v3.1 - Best Quality | Best results |

## 2. Export from Tripo

1. Click **Export**
2. Set **Format** to **FBX**
3. Select the **Mixamo** preset (this optimizes the export for Mixamo's auto-rigger)
4. Set **Texture Resolution** to **2k**
5. Turn on **Bottom Center Pivot**
6. Click **Export** and download the file

## 3. Check in Blender

Always verify the model in Blender before uploading to Mixamo.

### Import

1. Open Blender
2. **File → Import → FBX** — select your downloaded file

### Check Position and Scale

1. Press **Numpad 1** for front view — the model's feet should be **on or above** the ground plane (red X-axis line)
2. If the feet are below the ground:
   - Press **G** then **Z** to move the model up
   - Position feet on the ground plane
   - Press **Ctrl+A → Apply Location**
3. Press **N** to open the side panel → **Item** tab:
   - **Scale** should be **1.0, 1.0, 1.0** — if not, press **Ctrl+A → Apply Scale**
4. Check the model is **centered** on the X and Z axes

### Check Textures

- Press **Z** and select **Material Preview** to verify textures are applied

### Export for Mixamo

1. **File → Export → FBX**
2. In export settings:
   - Set **Path Mode** to **Copy**
   - Click the **small box icon** next to Path Mode (this embeds textures into the FBX)
3. Export the file

### Troubleshooting (if Mixamo rejects the file)

| Problem | Fix in Blender |
|---------|---------------|
| "Unable to map your existing skeleton" | Check **Outliner** (top-right) for a bone icon labeled "Armature" — select it and **Delete** it |
| Upload fails / too many polygons | Add **Decimate** modifier (wrench icon → Add Modifier → Decimate), set Ratio to ~0.05 (target ~50-100K faces), click dropdown arrow → **Apply** |

## 4. Upload to Mixamo

1. Go to [Mixamo](https://www.mixamo.com/)
2. Click **Upload Character**
3. Upload your exported FBX
4. Mixamo's auto-rigger will place markers on the model — adjust if needed
5. Click **Next** to rig the character

## 5. Download from Mixamo

1. After rigging, choose your animation (or just the T-pose)
2. Click **Download**
3. Set **Format** to **FBX**
4. Set **Skin** to **With Skin** (includes mesh and textures)
5. Download the file

## 6. Use in This Project

1. Run `npm run dev`
2. Drag and drop the Mixamo FBX/GLB file onto the viewport, or click **Load Model** to browse
3. If the model is off-center or not on the ground, the app will prompt you to fix it
4. Use the bone controls to adjust the pose
5. Use **Export Model (GLB)** to save the corrected model
