#!/usr/bin/env python3
"""Gera index.html (arquivo único, pronto para o GitHub Pages) a partir de src/."""
import pathlib
src = pathlib.Path(__file__).parent / "src"
order = ["data.js", "game.js", "models.js", "sims.js", "sims2.js", "llm.js", "lang-pt.js", "lang-pt2.js", "lang-en.js", "lang-en2.js", "app.js"]
js = "\n".join((src / f).read_text(encoding="utf-8") for f in order)
css = (src / "style.css").read_text(encoding="utf-8")
html = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>IAWise</title>
<meta name="description" content="Jogo instrutivo de redes neurais e aprendizagem por reforço com simuladores interativos, histórias e knowledge tracing. Derivado do DevWise.">
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div class="wrap" id="app"></div>
<script>
{js}
</script>
</body>
</html>
"""
(pathlib.Path(__file__).parent / "index.html").write_text(html, encoding="utf-8")
print("index.html gerado:", len(html) // 1024, "KB")
