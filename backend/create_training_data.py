import os
import cv2
import numpy as np
from pathlib import Path

print("🔄 Creating training dataset in backend/...")

base = Path("data/dataset")

def create_disease_image(disease_type):
    img = np.zeros((640, 640, 3), dtype=np.uint8)
    img[:, :] = [30, 100, 30]
    
    if "rust" in disease_type:
        for _ in range(15):
            x, y = np.random.randint(50, 590, 2)
            r = np.random.randint(15, 40)
            color = [np.random.randint(0, 80), np.random.randint(60, 150), np.random.randint(200, 255)]
            cv2.circle(img, (x, y), r, color, -1)
    elif "smut" in disease_type:
        for _ in range(10):
            x, y = np.random.randint(50, 590, 2)
            r = np.random.randint(10, 30)
            cv2.circle(img, (x, y), r, [0, 0, 0], -1)
    elif "blight" in disease_type:
        for _ in range(12):
            x, y = np.random.randint(50, 590, 2)
            r = np.random.randint(20, 50)
            color = [np.random.randint(0, 50), np.random.randint(80, 130), np.random.randint(140, 180)]
            cv2.circle(img, (x, y), r, color, -1)
    elif "coffee" in disease_type:
        for _ in range(20):
            x, y = np.random.randint(50, 590, 2)
            r = np.random.randint(5, 20)
            cv2.circle(img, (x, y), r, [np.random.randint(0, 50), np.random.randint(200, 255), np.random.randint(200, 255)], -1)
    return img

diseases = ["teff_rust", "teff_smut", "wheat_rust", "wheat_smut", "maize_leaf_blight", "coffee_rust"]

for disease_idx, disease in enumerate(diseases):
    print(f"  Creating {disease}...")
    
    # Training images (10 per disease)
    for i in range(10):
        img = create_disease_image(disease)
        cv2.imwrite(str(base / "images" / "train" / f"{disease}_{i}.jpg"), img)
        
        labels = []
        for _ in range(np.random.randint(1, 4)):
            x = np.random.uniform(0.2, 0.8)
            y = np.random.uniform(0.2, 0.8)
            w = np.random.uniform(0.15, 0.35)
            h = np.random.uniform(0.15, 0.35)
            labels.append(f"{disease_idx} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
        
        with open(base / "labels" / "train" / f"{disease}_{i}.txt", "w") as f:
            f.write("\n".join(labels))
    
    # Validation images (3 per disease)
    for i in range(3):
        img = create_disease_image(disease)
        cv2.imwrite(str(base / "images" / "val" / f"{disease}_{i}.jpg"), img)
        
        labels = []
        for _ in range(np.random.randint(1, 3)):
            x = np.random.uniform(0.2, 0.8)
            y = np.random.uniform(0.2, 0.8)
            w = np.random.uniform(0.15, 0.35)
            h = np.random.uniform(0.15, 0.35)
            labels.append(f"{disease_idx} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
        
        with open(base / "labels" / "val" / f"{disease}_{i}.txt", "w") as f:
            f.write("\n".join(labels))

print("✅ Dataset created successfully!")
print(f"📊 Training images: {len(list((base/'images'/'train').glob('*.jpg')))}")
print(f"📊 Validation images: {len(list((base/'images'/'val').glob('*.jpg')))}")
