# Pipeline de modelos 3D: do prato real ao cardápio

O app **não** transforma fotos comuns em modelos. A reconstrução é feita fora do servidor; o painel recebe o
resultado, valida, e só publica após aprovação.

## 1. Selecionar e preparar o alimento

- Uma unidade **representativa** da porção vendida (não a mais bonita da vitrine), recém-preparada.
- Prato/suporte neutro e fosco; evite louça brilhante e molhos que escorrem durante a captura.

## 2. Medir

- Régua ou paquímetro: **largura, profundidade e altura em cm**, com uma casa decimal.
- Fotografe a peça ao lado da régua (referência para conferência posterior).
- Anote no cadastro do modelo; estas medidas viram a referência de escala.

## 3. Fotografar (fotogrametria)

- Luz difusa e uniforme (caixa de luz ou dia nublado), sem sombras duras; desligue o flash.
- Fundo sem textura; mesa giratória ajuda.
- 3 alturas de câmera (≈ 15°, 45°, 70°) × 24–36 fotos por volta, com **60–80% de sobreposição**; depois vire a peça
  para capturar a base, se o formato permitir.
- Foco e exposição travados; nada de zoom digital.
- Alimentos que perdem forma ou brilham muito (sorvete, caldas) podem exigir modelagem manual.

## 4. Reconstruir (escolha uma)

| Ferramenta                                               | Plataforma      | Observação                                             |
| -------------------------------------------------------- | --------------- | ------------------------------------------------------ |
| Apple Object Capture (Reality Composer / app de captura) | macOS/iOS       | Gera USDZ direto; bom para objetos pequenos            |
| Polycam, Luma, KIRI Engine                               | iOS/Android/Web | Captura pelo celular; confira licença de uso comercial |
| RealityCapture, Metashape                                | Desktop         | Mais controle, curva de aprendizado maior              |
| Modelagem no Blender                                     | Desktop         | Para itens difíceis de capturar                        |

## 5. Limpar e corrigir (Blender)

- Remova fundo, mesa e partes soltas; feche buracos visíveis.
- **Unidades em metros**; aplique escala (`Ctrl+A → Scale`).
- Origem no **centro da base** e base apoiada em **y = 0** (Z = 0 no Blender, que é Z-up; o exportador glTF converte).
- Ajuste a escala para bater com as medidas do passo 2.
- Remova faces internas/invisíveis.

## 6. Materiais e texturas

- PBR: base color + normal + roughness (metalness quase sempre 0 em comida).
- Textura de 2048 px costuma bastar; 4096 só se o item for grande e muito visto de perto.

## 7. Otimizar

- Meta inicial: **até ~5 MB por GLB** (o painel avisa acima disso, sem bloquear).
- Reduza a malha (Decimate) para ~50–150 mil triângulos, conferindo silhueta.
- Texturas em WebP/KTX2 quando possível. Exemplo com gltf-transform:
  ```bash
  npx @gltf-transform/cli optimize entrada.glb saida.glb --texture-compress webp --texture-size 2048
  ```
- Valide: `node scripts/validate-models.mjs pasta/` (validador oficial do Khronos, 0 erros).

### Atalho: `scripts/prepare-model.mjs`

Para GLBs recebidos prontos (de fornecedor, scanner ou gerador por IA):

```bash
node scripts/prepare-model.mjs entrada.glb saida.glb --largura-cm 20 --triangulos 120000 --textura 1024
```

O script remove `EXT_meshopt_compression`/`KHR_mesh_quantization`/Draco (nem todo visualizador AR aceita, e o
`<model-viewer>` buscaria o decodificador num CDN externo), simplifica a malha, escala pela **largura total do modelo**
(se o modelo inclui prato, informe a largura do prato), centraliza, apoia a base em y = 0 e reduz as texturas mantendo
JPEG/PNG. Confira o resultado com `validate-models.mjs` e `render-posters.mjs`.

Exemplo real (cheeseburger gerado por IA): 995 mil → 120 mil triângulos, 8,5 → 4,3 MB, de 33,5 cm (unidade
arbitrária, origem no centro) para prato de 20 cm com base na mesa.

## 8. Exportar

- **GLB** (glTF 2.0 binário).
- **USDZ** para iPhone: Reality Converter (macOS) ou export do Object Capture. Confira escala e materiais no Quick Look.
- **Poster** WebP ~800×800, fundo transparente, mesmo ângulo do visualizador
  (`node scripts/render-posters.mjs` serve de referência para gerar a partir do GLB).

## 9. Validar proporções

- Abra o GLB no `/admin/modelos-3d` (pré-visualização) e confira medidas exibidas.
- Num celular compatível, posicione o modelo ao lado do prato real ou de uma régua.
- Diferença aceitável sugerida: até ~5% (o rastreamento do aparelho também varia).
- Só então marque **“Escala verificada presencialmente”**.

## 10. Enviar, aprovar e publicar

1. **Editor** envia GLB (+ USDZ + poster) e medidas em `/admin/modelos-3d` → status `ready_for_review` no bucket privado.
2. **Manager/owner** pré-visualiza, aprova ou rejeita.
3. **Manager/owner** publica: arquivos copiados para `published-3d/<rid>/<pid>/vN/`, versão anterior despublicada.
4. Teste no cardápio público em Android e iPhone (docs/HOMOLOGACAO.md).

## Substituir os assets demonstrativos

Os modelos em `public/demo/models` são procedurais (`scripts/generate-demo-models.mjs`) e marcados como
demonstrativos em todo lugar. Ao receber modelos reais: envie pelo painel (passo 10) e despublique/remova os itens
demonstrativos; em produção, não rode `supabase/seed.sql`.
