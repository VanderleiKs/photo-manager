# PhotoManager — Product Requirements Document

> **Versão:** 1.0  
> **Data:** 2026-09-28  
> **Status:** Em desenvolvimento  
> **Princípio central:** *A inteligência do sistema deve sugerir. O usuário decide.*

---

## Sumário

1. [Visão](#1-visão)
2. [Stack](#2-stack)
3. [Desktop](#3-desktop)
4. [Banco de Dados](#4-banco-de-dados)
5. [Arquivos Originais](#5-arquivos-originais)
6. [Conceito de Biblioteca](#6-conceito-de-biblioteca)
7. [Arquitetura](#7-arquitetura)
8. [Organização Interna do Node](#8-organização-interna-do-node)
9. [Scanner](#9-scanner)
10. [Indexação Incremental](#10-indexação-incremental)
11. [Pipeline de Análise](#11-pipeline-de-análise)
12. [Metadados](#12-metadados)
13. [Hash](#13-hash)
14. [Similaridade Visual](#14-similaridade-visual)
15. [Análise Visual de Sequências](#15-análise-visual-de-sequências)
16. [Sistema de Classificação](#16-sistema-de-classificação)
17. [Fotos de Momento](#17-fotos-de-momento)
18. [Motor de Sugestões de Exclusão](#18-motor-de-sugestões-de-exclusão)
19. [Revisão](#19-revisão)
20. [Lixeira](#20-lixeira)
21. [Qualidade Técnica](#21-qualidade-técnica)
22. [Valor Pessoal vs Qualidade](#22-valor-pessoal-vs-qualidade)
23. [Viagens e Eventos](#23-viagens-e-eventos)
24. [Álbuns](#24-álbuns)
25. [Timeline](#25-timeline)
26. [Filtros](#26-filtros)
27. [Busca](#27-busca)
28. [Álbuns Inteligentes Sugeridos](#28-álbuns-inteligentes-sugeridos)
29. [Pessoas](#29-pessoas)
30. [IA Local](#30-ia-local)
31. [Worker Threads](#31-worker-threads)
32. [Thumbnails](#32-thumbnails)
33. [Interface](#33-interface)
34. [Tela Inicial](#34-tela-inicial)
35. [Visualizador](#35-visualizador)
36. [Android — Preparação Arquitetural](#36-android--preparação-arquitetural)
37. [Portable](#37-portable)
38. [Segurança](#38-segurança)
39. [Operações Destrutivas](#39-operações-destrutivas)
40. [Roadmap](#40-roadmap)
41. [Definition of Done](#41-definition-of-done)
42. [Primeira Entrega dos Agentes](#42-primeira-entrega-dos-agentes)
43. [Resultado Esperado](#43-resultado-esperado)
44. [Princípios Finais](#44-princípios-finais)

---

## 1. Visão

O **PhotoManager** é um aplicativo desktop para Windows 11, inicialmente portátil, destinado a organizar bibliotecas pessoais de fotos e vídeos.

O sistema recebe uma pasta contendo uma grande quantidade de fotos desorganizadas, analisa seu conteúdo e constrói uma biblioteca inteligente.

O objetivo **não** é simplesmente mover arquivos entre pastas. O PhotoManager deve:

- [x] Indexar fotos e vídeos
- [x] Preservar os arquivos originais
- [x] Organizar visualmente por ano, mês e data
- [ ] Detectar duplicatas
- [ ] Detectar fotos visualmente semelhantes
- [ ] Identificar sequências de fotos tiradas em poucos segundos
- [ ] Identificar fotos tecnicamente ruins
- [ ] Identificar screenshots e imagens casuais
- [ ] Identificar fotos de "momentos" com baixo valor de retenção
- [ ] Sugerir fotos para exclusão
- [ ] Agrupar fotos em viagens e eventos
- [ ] Criar álbuns
- [ ] Criar álbuns inteligentes
- [ ] Permitir filtros combinados
- [ ] Permitir busca
- [ ] Permitir favoritos
- [ ] Permitir revisão manual das sugestões
- [ ] Manter uma lixeira segura
- [ ] Futuramente analisar fotos diretamente de dispositivos Android
- [ ] Funcionar prioritariamente de forma local e privada

### Princípio Central

> **A inteligência do sistema deve sugerir. O usuário decide.**

Nenhuma classificação deve, por si só, resultar em exclusão automática.

---

## 2. Stack

### Frontend

| Tecnologia | Versão |
|------------|--------|
| Angular | 22 |
| TypeScript | 6.x |
| Standalone Components | ✓ |
| Angular Signals | ✓ |
| RxJS | quando apropriado |
| Angular Router | ✓ |
| Tailwind CSS | 4.x |
| OpenNG/Optimus UI | V2 |
| PrimeIcons | ✓ |

### Ícones

Todos os ícones da interface devem utilizar **PrimeIcons**.

**Proibido:** Lucide, Font Awesome ou conjuntos de ícones diferentes sem decisão arquitetural explícita.

```html
<i class="pi pi-images"></i>
```

Os componentes visuais devem priorizar os componentes existentes no **Optimus UI V2**, utilizando Tailwind para layout e customizações necessárias.

---

## 3. Desktop

| Tecnologia | Versão |
|------------|--------|
| Electron | 44+ |
| Node.js | 24 |
| TypeScript | 6.x |

O aplicativo será distribuído como aplicação Windows 11 **portátil**.

O objetivo é permitir que o usuário mantenha o aplicativo junto da biblioteca em um HD externo.

### Estrutura Portable

```text
HD EXTERNO
│
├── Fotos
│   ├── backup antigo
│   ├── celular
│   ├── câmera
│   └── fotos antigas
│
└── PhotoManager
    ├── PhotoManager.exe
    ├── data/
    │   └── library.db
    ├── thumbnails/
    ├── cache/
    ├── models/
    └── logs/
```

O aplicativo **não deve depender** obrigatoriamente de instalação global do Node.js.

---

## 4. Banco de Dados

**SQLite** — o banco armazena o catálogo e **não** os arquivos originais.

A aplicação trabalha com **caminhos relativos** à biblioteca.

```text
Biblioteca: E:\Fotos
Arquivo:    backup\2024\IMG_1234.jpg
```

O banco armazena:

```text
relative_path = "backup/2024/IMG_1234.jpg"
```

Isso é fundamental para permitir que o HD seja conectado em outro computador.

---

## 5. Arquivos Originais

Durante a indexação:

- [ ] **NÃO mover arquivos**
- [ ] **NÃO renomear arquivos**
- [ ] **NÃO excluir arquivos**
- [ ] **NÃO reorganizar fisicamente a biblioteca**

O PhotoManager começa criando uma **camada lógica** sobre os arquivos existentes.

Somente uma ação explícita posterior poderá modificar o filesystem.

---

## 6. Conceito de Biblioteca

Uma `Library` representa uma pasta raiz.

```text
E:\Fotos
```

### Modelo

```text
Library
├── id
├── name
├── root_path
├── created_at
└── last_scan_at
```

O sistema deve futuramente suportar **múltiplas bibliotecas**.

```text
Fotos pessoais
Fotos antigas
Backup celular
```

---

## 7. Arquitetura

```text
┌─────────────────────────────────────────────┐
│                  Angular 22                 │
│                                             │
│ Timeline | Álbuns | Fotos | Busca | Review │
│                                             │
│ Tailwind + Optimus UI V2 + PrimeIcons      │
└──────────────────────┬──────────────────────┘
                       │
                  Electron IPC
                       │
┌──────────────────────▼──────────────────────┐
│                 Node.js 24                  │
│                                             │
│ Catalog                                     │
│ Scanner                                     │
│ Metadata                                    │
│ Thumbnail                                   │
│ Hashing                                     │
│ Similarity                                  │
│ Quality                                     │
│ Classification                              │
│ Events                                      │
│ Search                                      │
│ Filesystem                                  │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
    SQLite          Filesystem
    Catalog         Original files
                    Thumbnails
```

---

## 8. Organização Interna do Node

```text
src/
├── core/
│
├── catalog/
│   ├── libraries/
│   ├── photos/
│   ├── albums/
│   ├── events/
│   └── people/
│
├── ingestion/
│   ├── scanner/
│   ├── metadata/
│   └── media/
│
├── analysis/
│   ├── hashing/
│   ├── similarity/
│   ├── quality/
│   ├── classification/
│   ├── sequences/
│   └── events/
│
├── thumbnails/
│
├── search/
│
├── review/
│
├── trash/
│
├── filesystem/
│
└── desktop/
```

---

## 9. Scanner

O scanner recebe uma pasta raiz e percorre recursivamente.

```text
E:\Fotos
├── backup
├── celular
├── camera
├── antigas
└── 2024
```

Deve encontrar automaticamente os arquivos suportados.

### Formatos Iniciais

```text
.jpg
.jpeg
.png
.webp
.heic
.heif
.tif
.tiff
.gif
.mp4
.mov
.mkv
.avi
```

A arquitetura deve permitir adicionar formatos posteriormente.

---

## 10. Indexação Incremental

O scanner **não deve** processar novamente toda a biblioteca sempre que for executado.

### Primeira execução

```text
50.000 arquivos → indexar
```

### Segunda execução

```text
50.000 arquivos conhecidos
+ 300 novos
+ 20 modificados

→ processar somente os necessários
```

### Identificação rápida (inicial)

```text
path
size
modified_time
```

Posteriormente calcular hashes para identificação definitiva.

---

## 11. Pipeline de Análise

Cada mídia passa por um pipeline independente.

```text
Arquivo
   ↓
Discovery
   ↓
Metadata básica
   ↓
SQLite
   ↓
EXIF
   ↓
Thumbnail
   ↓
SHA-256
   ↓
Perceptual Hash
   ↓
Sequência temporal
   ↓
Qualidade
   ↓
Similaridade visual
   ↓
Classificação
   ↓
Eventos/Viagens
   ↓
Sugestões de revisão
```

**Uma falha em uma foto não pode interromper o processamento das demais.**

---

## 12. Metadados

Extrair quando disponíveis:

- [ ] Data original
- [ ] Hora
- [ ] GPS
- [ ] Fabricante
- [ ] Câmera
- [ ] Lente
- [ ] Orientação
- [ ] ISO
- [ ] Abertura
- [ ] Velocidade
- [ ] Dimensões
- [ ] Formato
- [ ] Tamanho
- [ ] Duração (vídeos)

### Estratégia de Fallback de Data

```text
EXIF DateTimeOriginal
        ↓
EXIF DateTime
        ↓
metadata do arquivo
        ↓
data de modificação
```

A origem da data deve ser registrada.

---

## 13. Hash

### Hash Criptográfico (SHA-256)

```text
A.jpg → SHA256 = ABC123
B.jpg → SHA256 = ABC123
→ duplicata exata
```

### Hash Perceptual

Identifica imagens visualmente próximas:

- Resize
- Compressão
- Pequenas alterações
- Cópias modificadas

---

## 14. Similaridade Visual

O sistema deve distinguir três conceitos:

### Duplicata

```text
A.jpg
B.jpg
mesmo conteúdo
```

### Imagens Semelhantes

```text
A.jpg
B.jpg
C.jpg
D.jpg
fotos diferentes da mesma cena
```

### Sequência

```text
14:32:01
14:32:02
14:32:03
14:32:04
14:32:05
fotos tiradas praticamente em sequência
```

Esses três conceitos **não devem** ser tratados como a mesma coisa.

---

## 15. Análise Visual de Sequências

Quando várias fotos forem tiradas em um intervalo curto, o sistema deve formar um grupo.

```text
Sequência: 6 fotos
[01] [02] [03] [04] [05] [06]
```

A análise visual deve determinar:

- [ ] Quais são praticamente iguais
- [ ] Quais possuem melhor nitidez
- [ ] Quais possuem melhor exposição
- [ ] Quais possuem olhos fechados
- [ ] Quais estão desfocadas
- [ ] Quais parecem ser a melhor composição

### Resultado

```text
6 fotos semelhantes
Melhor candidata: Foto 03
Outras: possíveis para revisão
```

O sistema **não deve excluir automaticamente** as demais.

---

## 16. Sistema de Classificação

Uma foto pode possuir múltiplas características.

```text
Photo
├── year: 2025
├── event: Gramado
├── category: viagem
├── quality: high
├── sequence: 129
├── favorite: true
└── review_status: none
```

**Não criar** uma única propriedade genérica:

```text
classification = "viagem"  // PROIBIDO
```

A classificação deve ser **multidimensional**.

---

## 17. Fotos de Momento

"Fotos de momento" representam fotos capturadas apenas para registrar algo temporariamente.

### Exemplos

- Foto de uma tela
- Foto de preço
- Foto de produto
- Foto de documento
- Foto de endereço
- Foto de informação
- Foto acidental
- Foto de objeto
- Foto de situação momentânea
- Screenshot
- Registro rápido sem valor aparente de longo prazo

Essas fotos **não devem ser automaticamente excluídas**.

O sistema deve classificá-las como:

```text
POSSIBLE_MOMENTARY
```

e gerar uma sugestão de revisão.

---

## 18. Motor de Sugestões de Exclusão

Todas as categorias de baixa retenção convergem para:

```text
ReviewCandidate
```

### Motivos

```text
EXACT_DUPLICATE
VISUAL_DUPLICATE
SIMILAR_SEQUENCE
BLURRY
DARK
OVEREXPOSED
LOW_RESOLUTION
SCREENSHOT
MOMENTARY
ACCIDENTAL
LOW_INFORMATION
```

Uma foto pode possuir múltiplos motivos.

```text
IMG_1234.jpg
├── foto momentânea
├── semelhante a outras 5 fotos
└── baixa nitidez
```

### Exemplo de UI

```text
Organizar
├── 1.248 possíveis duplicatas
├── 382 fotos borradas
├── 641 screenshots
├── 927 fotos momentâneas
└── 2.391 fotos semelhantes
```

---

## 19. Revisão

Cada grupo deve permitir:

- [ ] Manter
- [ ] Favoritar
- [ ] Ignorar sugestão
- [ ] Enviar para lixeira

**Nunca usar:** "Excluir automaticamente" como comportamento padrão.

---

## 20. Lixeira

```text
Foto
 ↓
Enviar para lixeira
 ↓
PhotoManager/Trash
 ↓
Revisão
 ↓
Excluir definitivamente
```

### Dados Guardados

```text
original_path
trash_path
deleted_at
```

Permitir **restauração**.

---

## 21. Qualidade Técnica

Analisar, quando possível:

- [ ] Nitidez
- [ ] Blur
- [ ] Exposição
- [ ] Resolução
- [ ] Proporção
- [ ] Imagem praticamente vazia
- [ ] Imagem muito escura
- [ ] Imagem excessivamente clara

### Resultado

```text
Qualidade técnica: baixa
```

Isso **não significa**:

```text
Valor pessoal: baixo
```

---

## 22. Valor Pessoal vs Qualidade

Essa separação é **obrigatória**.

```text
Qualidade técnica: LOW
Valor pessoal: UNKNOWN
Favorita: YES
```

O sistema **nunca deve assumir** que qualidade técnica baixa significa que a foto não possui valor.

---

## 23. Viagens e Eventos

O sistema combina:

```text
data/hora + GPS + distância + intervalos + sequências + análise visual
```

para sugerir eventos.

### Exemplo

```text
10/07  Porto Alegre
10/07  Gramado
11/07  Gramado
12/07  Canela
12/07  Porto Alegre
```

**Sugestão:**

```text
Viagem para Gramado e Canela
10–12 julho 2025
426 fotos
```

O usuário pode:

- [ ] Aceitar
- [ ] Editar
- [ ] Ignorar

---

## 24. Álbuns

### Álbum Manual

O usuário escolhe fotos.

```text
Gramado — Fotos favoritas
```

### Álbum Inteligente

Definido por critérios.

```text
Fotos de 2025
```

ou:

```text
Fotos de Gramado + Favoritas + Qualidade alta
```

Os álbuns **não devem duplicar arquivos**.

---

## 25. Timeline

```text
Ano → Mês → Dia → Evento → Sequência
```

### Exemplo

```text
2025
Julho

10 JUL
Gramado
[ ][ ][ ][ ][ ][ ]

11 JUL
Gramado
[ ][ ][ ][ ][ ][ ][ ]

12 JUL
Canela
[ ][ ][ ][ ]
```

---

## 26. Filtros

Filtros combináveis:

- [ ] Ano
- [ ] Mês
- [ ] Data
- [ ] Evento
- [ ] Álbum
- [ ] Local
- [ ] Pessoa
- [ ] Categoria
- [ ] Qualidade
- [ ] Favorito
- [ ] Tipo de mídia
- [ ] Status de revisão

### Exemplo

```text
Ano: 2025
Evento: Gramado
Favorito: Sim
Qualidade: Alta
→ 84 fotos
```

---

## 27. Busca

### Primeira versão

- [ ] Nome
- [ ] Data
- [ ] Ano
- [ ] Evento
- [ ] Álbum
- [ ] Local
- [ ] Pessoa
- [ ] Categoria

### Futuro

```text
"fotos de praia"
"fotos com carro"
"fotos do gato"
"fotos tiradas em Gramado"
```

utilizando classificação visual e embeddings.

---

## 28. Álbuns Inteligentes Sugeridos

O sistema pode sugerir:

- [ ] Viagens
- [ ] Melhores fotos
- [ ] Para revisar
- [ ] 2025
- [ ] Praia
- [ ] Animais
- [ ] Pessoas
- [ ] Eventos
- [ ] Sequências
- [ ] Screenshots

Os álbuns devem ser baseados no catálogo, **não em cópias físicas**.

---

## 29. Pessoas

A arquitetura deve estar preparada para identificação de pessoas.

### Inicialmente

```text
Face detected
```

### Futuramente

```text
Pessoa A
Pessoa B
Pessoa C
```

O reconhecimento deve ser **local** quando possível.

**Nenhuma imagem deve ser enviada para serviços externos sem ação explícita do usuário.**

---

## 30. IA Local

A inteligência deve ser modular.

```ts
interface VisionAnalyzer {
  analyze(image: ImageInput): Promise<VisionResult>
}
```

### Implementações futuras

```text
ImageSimilarityAnalyzer
ObjectAnalyzer
SceneAnalyzer
FaceAnalyzer
EmbeddingAnalyzer
```

O catálogo **não deve depender** diretamente de um modelo específico.

---

## 31. Worker Threads

Operações pesadas devem ocorrer fora do processo principal.

```text
Main Process
     │
     ▼
Job Queue
     │
 ┌───┼────┬────┐
 ▼   ▼    ▼    ▼
W1   W2   W3   W4
```

### Usar Worker Threads para

- [ ] Processamento de imagens
- [ ] Geração de thumbnails
- [ ] Hashing
- [ ] Análise visual
- [ ] Embeddings
- [ ] Tarefas CPU-intensive

A quantidade de workers deve ser controlada para não saturar o computador ou o HD externo.

---

## 32. Thumbnails

**Nunca carregar** dezenas de milhares de imagens originais simultaneamente.

### Estrutura

```text
thumbnails/
├── 256/
├── 512/
└── 1024/
```

Preferencialmente **WebP** para thumbnails.

A galeria deve utilizar:

- [ ] Lazy loading
- [ ] Virtualização
- [ ] Carregamento progressivo

---

## 33. Interface

**Angular 22 + Tailwind CSS + Optimus UI V2 + PrimeIcons.**

### Menu Principal

```text
Biblioteca
├── Todas as fotos
├── Timeline
├── Álbuns
├── Viagens
├── Pessoas
└── Favoritos

Organizar
├── Possíveis duplicatas
├── Fotos semelhantes
├── Baixa qualidade
├── Fotos momentâneas
├── Screenshots
└── Revisão

Configurações
```

Os ícones reais serão **PrimeIcons**.

---

## 34. Tela Inicial

A home deve apresentar a situação da biblioteca.

```text
Minha biblioteca

48.293 fotos
3.821 vídeos

2026  1.283 fotos
2025  8.392 fotos

Organização
1.248 duplicatas
927 momentâneas
382 baixa qualidade
2.391 semelhantes

Viagens
17 viagens detectadas
```

---

## 35. Visualizador

Ao abrir uma foto:

```text
┌──────────────────────────────────────────┐
│                  FOTO                    │
├──────────────────────────────────────────┤
│ IMG_1234.jpg                             │
│ 12/07/2025 14:32                         │
│ Gramado, RS                              │
│                                          │
│ Qualidade: Alta                          │
│ Sequência: 12 fotos                      │
│                                          │
│ [Favoritar] [Álbum] [Revisar]            │
└──────────────────────────────────────────┘
```

---

## 36. Android — Preparação Arquitetural

O Android **não será implementado** na primeira versão.

Entretanto, o núcleo deve ser projetado para suportar múltiplas fontes.

```ts
interface MediaSource {
  scan(): AsyncIterable<MediaItem>
}
```

### Implementações futuras

```text
LocalFolderSource
ExternalDriveSource
AndroidSource
NetworkSource
```

Hoje:

```text
LocalFolderSource → HD externo
```

Futuramente:

```text
Android → AndroidSource → PhotoManager
```

---

## 37. Portable

```text
PhotoManager/
├── PhotoManager.exe
├── resources/
├── data/
│   └── library.db
├── thumbnails/
├── cache/
├── models/
└── logs/
```

O usuário deve poder copiar a pasta inteira para outro HD/computador.

---

## 38. Segurança

A aplicação deve ser:

- [ ] Local-first
- [ ] Offline-first
- [ ] Privacy-first

Por padrão: **nenhuma foto deve sair do computador.**

Serviços externos de IA, reconhecimento ou armazenamento só poderão existir mediante implementação explícita e consentimento do usuário.

---

## 39. Operações Destrutivas

As seguintes operações exigem **confirmação**:

- [ ] Excluir
- [ ] Mover
- [ ] Renomear
- [ ] Reorganizar fisicamente

Antes de uma operação física, mostrar:

```text
ANTES
E:\Fotos\backup\IMG_1234.jpg

DEPOIS
E:\Fotos\2025\Viagens\Gramado\IMG_1234.jpg
```

O usuário deve confirmar.

---

## 40. Roadmap

### Fase 1 — Foundation

- [ ] Angular 22
- [ ] Tailwind CSS
- [ ] Optimus UI V2
- [ ] PrimeIcons
- [ ] Electron
- [ ] Node.js 24
- [ ] TypeScript
- [ ] SQLite
- [ ] Arquitetura de módulos
- [ ] Comunicação Angular ↔ Electron/Node
- [ ] Execução portable

**Critério:** Aplicação abre e permite selecionar uma pasta.

---

### Fase 2 — Scanner

- [ ] Scan recursivo
- [ ] Detecção de imagens
- [ ] Detecção de vídeos
- [ ] Indexação incremental
- [ ] Metadados básicos
- [ ] Thumbnails
- [ ] SHA-256
- [ ] Perceptual Hash

---

### Fase 3 — Catálogo

- [ ] Timeline
- [ ] Filtros combinados
- [ ] Busca básica
- [ ] Favoritos
- [ ] Álbuns manuais
- [ ] Álbuns inteligentes

---

### Fase 4 — Análise

- [ ] Qualidade técnica
- [ ] Similaridade visual
- [ ] Sequências
- [ ] Classificação multidimensional
- [ ] Fotos de momento
- [ ] Screenshots

---

### Fase 5 — Revisão

- [ ] Motor de sugestões
- [ ] Interface de revisão
- [ ] Lixeira segura
- [ ] Restauração

---

### Fase 6 — Eventos

- [ ] Detecção de viagens
- [ ] Agrupamento por evento
- [ ] Sugestões de eventos
- [ ] Mapa (futuro)

---

### Fase 7 — IA Avançada

- [ ] VisionAnalyzer interface
- [ ] Embeddings
- [ ] Busca semântica
- [ ] Reconhecimento de pessoas
- [ ] Modelos locais

---

### Fase 8 — Organização Física

- [ ] Mover arquivos
- [ ] Renomear arquivos
- [ ] Reorganizar biblioteca
- [ ] Confirmação de operações

---

### Fase 9 — Android

- [ ] MediaSource abstraction
- [ ] AndroidSource
- [ ] Sincronização
- [ ] PhotoManager Mobile

---

## 41. Definition of Done

Uma funcionalidade só será considerada concluída quando:

- [ ] Código compilar
- [ ] Testes passarem
- [ ] Tratamento de erro existir
- [ ] Operações longas não bloquearem a UI
- [ ] Progresso existir quando aplicável
- [ ] Cancelamento funcionar quando aplicável
- [ ] Arquivos originais permanecerem intactos
- [ ] Migrations estiverem versionadas
- [ ] Logs estiverem implementados
- [ ] UI utilizar Optimus UI V2 quando houver componente adequado
- [ ] Ícones utilizarem PrimeIcons
- [ ] Layout utilizar Tailwind CSS
- [ ] Comportamento for validado com arquivos reais
- [ ] Arquivos corrompidos não interromperem o processamento da biblioteca inteira

---

## 42. Primeira Entrega dos Agentes

A primeira entrega deve ser **somente a fundação funcional**.

```text
PhotoManager.exe
      ↓
Selecionar biblioteca
      ↓
Selecionar pasta
      ↓
Scanner
      ↓
SQLite
      ↓
Contagem
      ↓
Primeira galeria
```

### Não implementar inicialmente

- [ ] IA
- [ ] Reconhecimento facial
- [ ] Viagens
- [ ] Exclusão
- [ ] Organização física
- [ ] Android

A arquitetura, entretanto, deve deixar esses recursos possíveis **sem refatoração estrutural**.

---

## 43. Resultado Esperado

Ao final do projeto, o usuário poderá apontar o PhotoManager para uma pasta aparentemente caótica:

```text
E:\Fotos
├── backup celular
├── celular antigo
├── câmera
├── fotos copiadas
├── backup 2021
├── backup 2022
└── backup 2025
```

e receber uma biblioteca inteligente:

```text
48.293 fotos
3.821 vídeos

Timeline
2026
2025
2024
2023
2022

Viagens
Gramado — 2025
Florianópolis — 2024
Buenos Aires — 2023

Organizar
1.248 duplicatas
2.391 semelhantes
382 baixa qualidade
641 screenshots
927 fotos momentâneas

Favoritos
1.203

Sugestões
"Encontramos 14 sequências onde há fotos muito semelhantes. Deseja revisar?"
```

O sistema **não precisa destruir** a estrutura original para oferecer uma organização inteligente.

A biblioteca lógica será a principal camada de organização; a organização física será uma funcionalidade posterior e explícita.

---

## 44. Princípios Finais

O desenvolvimento deve seguir esta ordem:

1. **Segurança dos arquivos**
2. **Catálogo confiável**
3. **Performance**
4. **Experiência de navegação**
5. **Detecção de duplicatas**
6. **Similaridade visual**
7. **Sugestões inteligentes**
8. **Viagens e álbuns**
9. **IA avançada**
10. **Organização física**
11. **Android**

O produto deve evoluir de um **organizador de biblioteca** para um **assistente inteligente de organização de fotos**, sem que a IA tenha controle destrutivo sobre os arquivos.

---

## Apêndice A — Tarefas Detalhadas por Fase

### Fase 1 — Foundation (Sprint 1-2)

#### 1.1 Setup do Projeto
- [ ] Inicializar projeto Angular 22 com standalone components
- [ ] Configurar Tailwind CSS 4.x
- [ ] Configurar Optimus UI V2
- [ ] Configurar PrimeIcons
- [ ] Configurar Electron com Node.js 24
- [ ] Configurar TypeScript strict mode
- [ ] Configurar ESLint + Prettier
- [ ] Configurar testes unitários (Jest/Vitest)
- [ ] Configurar testes E2E (Playwright)

#### 1.2 Arquitetura Base
- [ ] Criar estrutura de pastas conforme seção 8
- [ ] Criar abstração `MediaSource` interface
- [ ] Criar abstração `VisionAnalyzer` interface
- [ ] Criar sistema de injeção de dependência
- [ ] Criar sistema de eventos interno
- [ ] Criar sistema de logging
- [ ] Criar sistema de configuração

#### 1.3 Banco de Dados
- [ ] Configurar SQLite com better-sqlite3
- [ ] Criar sistema de migrations
- [ ] Criar migration inicial (tabelas: libraries, photos, albums, events)
- [ ] Criar repositórios base
- [ ] Criar sistema de conexão

#### 1.4 Electron
- [ ] Configurar processo main do Electron
- [ ] Configurar preload scripts
- [ ] Criar IPC bridge seguro
- [ ] Criar sistema de comunicação Angular ↔ Electron
- [ ] Configurar janela principal
- [ ] Configurar menu da aplicação
- [ ] Criar sistema de auto-update (futuro)

#### 1.5 UI Base
- [ ] Criar layout principal (sidebar + content)
- [ ] Criar sidebar com menu de navegação
- [ ] Criar sistema de rotas
- [ ] Criar componentes base (Button, Card, Modal, etc.)
- [ ] Criar sistema de temas (claro/escuro)
- [ ] Criar sistema de notificações
- [ ] Criar sistema de loading states

#### 1.6 Portable
- [ ] Configurar electron-builder
- [ ] Criar build portable para Windows
- [ ] Testar execução em HD externo
- [ ] Criar estrutura de pastas portable
- [ ] Documentar processo de build

---

### Fase 2 — Scanner (Sprint 3-4)

#### 2.1 Scanner Base
- [ ] Criar serviço de scanner
- [ ] Implementar scan recursivo de pastas
- [ ] Criar filtro de formatos suportados
- [ ] Criar sistema de progresso
- [ ] Criar sistema de cancelamento
- [ ] Criar tratamento de erros por arquivo
- [ ] Criar logs detalhados

#### 2.2 Indexação Incremental
- [ ] Criar sistema de detecção de novos arquivos
- [ ] Criar sistema de detecção de arquivos modificados
- [ ] Criar sistema de detecção de arquivos removidos
- [ ] Criar cache de metadados
- [ ] Criar sistema de sincronização

#### 2.3 Metadados
- [ ] Criar extrator de EXIF
- [ ] Criar extrator de metadados de vídeo
- [ ] Criar sistema de fallback de data
- [ ] Criar normalização de metadados
- [ ] Criar sistema de cache de metadados

#### 2.4 Thumbnails
- [ ] Criar serviço de thumbnails
- [ ] Implementar geração de thumbnails (256, 512, 1024)
- [ ] Criar sistema de cache de thumbnails
- [ ] Criar carregamento progressivo
- [ ] Criar placeholder para thumbnails

#### 2.5 Hashing
- [ ] Criar serviço de SHA-256
- [ ] Criar serviço de perceptual hash
- [ ] Criar sistema de cache de hashes
- [ ] Criar detecção de duplicatas exatas
- [ ] Criar detecção de duplicatas perceptuais

---

### Fase 3 — Catálogo (Sprint 5-6)

#### 3.1 Timeline
- [ ] Criar componente de timeline
- [ ] Criar agrupamento por ano/mês/dia
- [ ] Criar navegação temporal
- [ ] Criar filtros temporais
- [ ] Criar ordenação temporal

#### 3.2 Filtros
- [ ] Criar sistema de filtros combináveis
- [ ] Criar filtros por metadados
- [ ] Criar filtros por classificação
- [ ] Criar filtros por qualidade
- [ ] Criar persistência de filtros

#### 3.3 Busca
- [ ] Criar serviço de busca
- [ ] Criar busca por nome
- [ ] Criar busca por data
- [ ] Criar busca por evento
- [ ] Criar busca por álbum
- [ ] Criar busca por local
- [ ] Criar busca por pessoa
- [ ] Criar busca por categoria

#### 3.4 Favoritos
- [ ] Criar sistema de favoritos
- [ ] Criar toggle de favorito
- [ ] Criar filtro de favoritos
- [ ] Criar ordenação por favoritos

#### 3.5 Álbuns
- [ ] Criar modelo de álbum
- [ ] Criar álbum manual
- [ ] Criar álbum inteligente
- [ ] Criar CRUD de álbuns
- [ ] Criar adição de fotos a álbuns
- [ ] Criar remoção de fotos de álbuns

---

### Fase 4 — Análise (Sprint 7-8)

#### 4.1 Qualidade Técnica
- [ ] Criar analisador de nitidez
- [ ] Criar analisador de blur
- [ ] Criar analisador de exposição
- [ ] Criar analisador de resolução
- [ ] Criar analisador de proporção
- [ ] Criar analisador de imagem vazia
- [ ] Criar analisador de imagem escura
- [ ] Criar analisador de imagem clara
- [ ] Criar score de qualidade

#### 4.2 Similaridade Visual
- [ ] Criar sistema de similaridade
- [ ] Criar detecção de duplicatas visuais
- [ ] Criar detecção de imagens semelhantes
- [ ] Criar agrupamento por similaridade
- [ ] Criar score de similaridade

#### 4.3 Sequências
- [ ] Criar detecção de sequências
- [ ] Criar agrupamento por sequência
- [ ] Criar análise de melhor candidata
- [ ] Criar análise de nitidez em sequência
- [ ] Criar análise de exposição em sequência
- [ ] Criar análise de olhos fechados
- [ ] Criar análise de desfoque
- [ ] Criar análise de composição

#### 4.4 Classificação
- [ ] Criar sistema de classificação multidimensional
- [ ] Criar categorias (viagem, momento, screenshot, etc.)
- [ ] Criar tags automáticas
- [ ] Criar tags manuais
- [ ] Criar sistema de labels

#### 4.5 Fotos de Momento
- [ ] Criar detector de screenshots
- [ ] Criar detector de fotos de tela
- [ ] Criar detector de fotos de preço
- [ ] Criar detector de fotos de produto
- [ ] Criar detector de fotos de documento
- [ ] Criar detector de fotos de endereço
- [ ] Criar detector de fotos de informação
- [ ] Criar detector de fotos acidentais
- [ ] Criar detector de fotos de objeto
- [ ] Criar score de momento

---

### Fase 5 — Revisão (Sprint 9-10)

#### 5.1 Motor de Sugestões
- [ ] Criar motor de sugestões
- [ ] Criar regras de sugestão
- [ ] Criar score de retenção
- [ ] Criar agrupamento de sugestões
- [ ] Criar priorização de sugestões

#### 5.2 Interface de Revisão
- [ ] Criar tela de revisão
- [ ] Criar cards de sugestão
- [ ] Criar ações (manter, favoritar, ignorar, lixeira)
- [ ] Criar revisão em lote
- [ ] Criar histórico de revisão

#### 5.3 Lixeira
- [ ] Criar sistema de lixeira
- [ ] Criar envio para lixeira
- [ ] Criar restauração de lixeira
- [ ] Criar exclusão definitiva
- [ ] Criar limpeza automática
- [ ] Criar confirmação de exclusão

---

### Fase 6 — Eventos (Sprint 11-12)

#### 6.1 Detecção de Viagens
- [ ] Criar detector de viagens
- [ ] Criar agrupamento por local
- [ ] Criar agrupamento por data
- [ ] Criar agrupamento por distância
- [ ] Criar agrupamento por intervalo
- [ ] Criar agrupamento por sequência
- [ ] Criar agrupamento por análise visual

#### 6.2 Interface de Eventos
- [ ] Criar tela de eventos
- [ ] Criar cards de evento
- [ ] Criar mapa de evento (futuro)
- [ ] Criar timeline de evento
- [ ] Criar edição de evento
- [ ] Criar aceite de evento
- [ ] Criar rejeição de evento

---

### Fase 7 — IA Avançada (Sprint 13-14)

#### 7.1 VisionAnalyzer
- [ ] Criar interface VisionAnalyzer
- [ ] Criar ImageSimilarityAnalyzer
- [ ] Criar ObjectAnalyzer
- [ ] Criar SceneAnalyzer
- [ ] Criar FaceAnalyzer
- [ ] Criar EmbeddingAnalyzer

#### 7.2 Embeddings
- [ ] Criar sistema de embeddings
- [ ] Criar busca semântica
- [ ] Criar cache de embeddings
- [ ] Criar atualização de embeddings

#### 7.3 Reconhecimento de Pessoas
- [ ] Criar detector de faces
- [ ] Criar agrupamento de faces
- [ ] Criar reconhecimento de pessoas
- [ ] Criar interface de pessoas
- [ ] Criar edição de pessoas

---

### Fase 8 — Organização Física (Sprint 15-16)

#### 8.1 Mover Arquivos
- [ ] Criar serviço de mover
- [ ] Criar confirmação de operação
- [ ] Criar preview de operação
- [ ] Criar execução de operação
- [ ] Criar rollback de operação
- [ ] Criar log de operações

#### 8.2 Renomear Arquivos
- [ ] Criar serviço de renomear
- [ ] Criar confirmação de operação
- [ ] Criar preview de operação
- [ ] Criar execução de operação
- [ ] Criar rollback de operação
- [ ] Criar log de operações

#### 8.3 Reorganizar Biblioteca
- [ ] Criar serviço de reorganização
- [ ] Criar confirmação de operação
- [ ] Criar preview de operação
- [ ] Criar execução de operação
- [ ] Criar rollback de operação
- [ ] Criar log de operações

---

### Fase 9 — Android (Sprint 17+)

#### 9.1 MediaSource
- [ ] Criar interface MediaSource
- [ ] Criar LocalFolderSource
- [ ] Criar ExternalDriveSource
- [ ] Criar AndroidSource
- [ ] Criar NetworkSource

#### 9.2 PhotoManager Mobile
- [ ] Criar app Android
- [ ] Criar sincronização
- [ ] Criar interface mobile
- [ ] Criar notificações
- [ ] Criar configurações

---

## Apêndice B — Estrutura de Pastas

```text
photo-manager/
├── docs/
│   └── PRD.md
├── src/
│   ├── main/                    # Electron main process
│   │   ├── core/
│   │   ├── catalog/
│   │   ├── ingestion/
│   │   ├── analysis/
│   │   ├── thumbnails/
│   │   ├── search/
│   │   ├── review/
│   │   ├── trash/
│   │   ├── filesystem/
│   │   └── desktop/
│   ├── preload/                 # Electron preload scripts
│   └── renderer/                # Angular app
│       ├── app/
│       │   ├── core/
│       │   ├── features/
│       │   │   ├── library/
│       │   │   ├── timeline/
│       │   │   ├── albums/
│       │   │   ├── events/
│       │   │   ├── people/
│       │   │   ├── favorites/
│       │   │   ├── organize/
│       │   │   ├── review/
│       │   │   ├── search/
│       │   │   └── settings/
│       │   └── shared/
│       └── assets/
├── data/
│   └── library.db
├── thumbnails/
│   ├── 256/
│   ├── 512/
│   └── 1024/
├── cache/
├── models/
├── logs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
├── .github/
│   └── workflows/
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── tailwind.config.js
├── angular.json
├── electron-builder.yml
├── package.json
├── README.md
└── LICENSE
```

---

## Apêndice C — Convenções de Código

### TypeScript
- Strict mode enabled
- Sempre tipar funções públicas
- Usar interfaces para contratos
- Usar types para unions

### Angular
- Standalone components
- Signals para estado reativo
- OnPush change detection
- Lazy loading de rotas

### CSS
- Tailwind CSS para utility classes
- CSS custom properties para temas
- Mobile-first responsive

### Commits
- Conventional Commits
- Commits pequenos e frequentes
- Mensagens claras e descritivas

### Branches
- `main` — produção
- `develop` — desenvolvimento
- `feature/*` — funcionalidades
- `fix/*` — correções
- `hotfix/*` — correções urgentes

---

## Apêndice D — Métricas de Sucesso

### Performance
- [ ] Scan de 50.000 arquivos em < 5 minutos
- [ ] Geração de thumbnail em < 200ms
- [ ] Busca em < 100ms
- [ ] UI responsiva (< 16ms por frame)

### Qualidade
- [ ] Cobertura de testes > 80%
- [ ] Zero bugs críticos em produção
- [ ] Zero perda de dados
- [ ] Zero modificação não autorizada de arquivos

### Usabilidade
- [ ] Tempo para primeira galeria < 30s
- [ ] Curva de aprendizado < 5 minutos
- [ ] Satisfação do usuário > 4.5/5

---

**Fim do documento.**
