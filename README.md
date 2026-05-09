<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,6,30&height=180&section=header&text=Extraxtor&fontSize=52&fontColor=000000&fontAlignY=38&desc=Risk+and+reward+cyber-dungeon+game+as+a+Farcaster+mini+app&descAlignY=58&descSize=14&animation=fadeIn" width="100%"/>

<div align="center">

[![Play](https://img.shields.io/badge/Play%20Now-bbf7d0?style=for-the-badge&logoColor=000)](https://extraxtor.vercel.app)
[![License](https://img.shields.io/badge/MIT-bfdbfe?style=for-the-badge&logoColor=000)](LICENSE)
[![Platform](https://img.shields.io/badge/Farcaster%20Mini%20App-fde68a?style=for-the-badge&logoColor=000)]()
[![Tech](https://img.shields.io/badge/JavaScript%20%2B%20HTML-fca5a5?style=for-the-badge&logoColor=000)]()

</div>

<div align="center">
<i>Descend deeper into a cyber dungeon to extract more loot .... but each level drains HP and increases risk. Know when to extract or lose everything.</i>
</div>

---

```
+--[ The Extraction ]----------------+
|  Depth: 0     HP: 100/100          |
|  [ Go Deeper ]   [ Extract ]       |
+------------------------------------+
```

---

## ✦ Features

<div align="center">

| | Feature | What it does |
|:---:|---|---|
| 🏰 | Dungeon descent | Each floor deeper increases loot but drains HP |
| ❤️ | HP management | Taking damage per floor, reaching 0 means losing everything |
| 💰 | Risk vs reward | Extract early with small gains or push deeper for bigger payout |
| 📱 | Farcaster native | Runs inside Warpcast / Base app as a mini app |
| ⚡ | Zero install | Pure browser game with no build step |

</div>

---

## ✦ Download & Run

**Step 1** .... Clone the repo

```bash
git clone https://github.com/0xnurrabby/Extraxtor
cd Extraxtor
```

**Step 2** .... Serve the files

```bash
# Simplest option - open directly
start index.html

# Or serve with any local server
npx serve .
# Then open http://localhost:3000
```

**Step 3** .... Play

---

## ✦ Setup

```
1. Clone the repo
2. Open index.html in a browser
   (Some browsers require a local server for ES module imports)
3. For local server: run npx serve . and open http://localhost:3000
4. To test as a Farcaster mini app: deploy to Vercel
   and open inside Warpcast or Base app
```

---

## ✦ Project Structure

```
Extraxtor/
  index.html     ->  game entry point with Farcaster mini app meta
  app.js         ->  full game logic: dungeon, HP, extraction, loot
  styles.css     ->  cyber/dark theme UI styles
  assets/        ->  icons, splash images, embed images
  .well-known/   ->  Farcaster app manifest
```

---

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,6,30&height=100&section=footer&animation=fadeIn" width="100%"/>

<div align="center">MIT License .... built by <a href="https://github.com/0xnurrabby">0xnurrabby</a></div>
