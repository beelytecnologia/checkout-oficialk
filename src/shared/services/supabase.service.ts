// shared/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { FileObject } from '@supabase/storage-js';
import { environment } from '../Environment/environment';

export interface Prod {
  id          : string;
  name        : string;
  price_cents : number;
  categoria   : string;
  img_url     : string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
    { auth: { persistSession:false, autoRefreshToken:false } }
  );

  private readonly table         = 'all_products_emporio_json';
  private readonly storageBucket = 'imagens';

  /* ───── utils ───── */

  /** slug “tradicional” usado como id (a-z0-9-) */
  private slug(s = ''): string {
    return s
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** chave para casamentos (remove acento + espaços, ignora case) */
/** chave: minúsculo, sem acento, SOMENTE a-z 0-9  */
private key(s = ''): string {
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');                      // remove TUDO exceto a-z0-9
}


  private publicUrl(path: string) {
    console.debug(`publicUrl(${path})`);
    return this.supabase
             .storage
             .from(this.storageBucket)
      .getPublicUrl(path).data.publicUrl;

  }

  /** Lista todos os arquivos do bucket, percorrendo sub-pastas */
private async listAllFiles(): Promise<FileObject[]> {
  const all: FileObject[] = [];

  const recurse = async (path?: string) => {
    const res = await this.supabase.storage
      .from(this.storageBucket)
      .list(path, { limit: 1000 });          // path = undefined → raiz
    console.log('🔎 storage.list:', path, res);
    if (res.error) {
      console.error('‼️ storage.list error:', res.error);
      return;
    }
    if (!res.data) return;

    for (const item of res.data) {
      if (item.name && item.id) {
        // é arquivo
        const fullName = path ? `${path}/${item.name}` : item.name;
        all.push({ ...item, name: fullName });
      } else {
        // é pasta
        const nextPath = path ? `${path}/${item.name}` : item.name;
        await recurse(nextPath);
      }
    }
  };

  await recurse();            // começa na raiz
  console.log('🔎 total files encontrados:', all.length);
  return all;
}


  /* ───── 1. catálogo somente leitura ───── */
  async getCatalog(): Promise<Prod[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('data')
      .single();
    if (error) throw error;

    const arr = (data?.data ?? []) as any[];
    const slugCount: Record<string, number> = {};

    return arr.map<Prod>(p => {
      let slug = this.slug(p.name);
      if (slugCount[slug]) slug = `${slug}-${++slugCount[slug]}`;
      else slugCount[slug] = 1;

      return {
        id          : slug,
        name        : p.name,
        price_cents : Math.round((p.price ?? 0) * 100),
        categoria   : p.categoria ?? '',
        img_url     : p.img_url ?? ''
      };
    });
  }
// shared/services/supabase.service.ts  (acrescente perto do topo)

/** ❶  Mapa fixo: Produto → nome exato do arquivo no bucket  */
private staticPairs: Record<string, string> = {
  /* ––– PROVOLONE DESIDRATADO ––– */
  'Desidratado - Provolone Gouda'              : 'Provolone Desidratado Gouda.png',
  'Desidratado - Provolone Temperado'          : 'Provolone Desidratado Temperado.png',
  'Desidratado - Provolone Misto'              : 'Provolone Desidratado Misto.png',
  'Desidratado - Provolone Natural'            : 'Provolone Desidratado Puro.png',
  'Desidratado - Provolone com Goiabada'       : 'Provolone Desidratado com Goiabada.png',

  /* ––– FAROFAS ––– */
  'Farofa Nobre Tradicional'                   : 'Farofa Nobre Tradicional.png',
  'Farofa Nobre com Alho'                      : 'Farofa Nobre de Alho.png',
  'Farofa Nobre com Carne Seca'                : 'Farofa Nobre de Carne Seca.png',
  'Farofa Nobre com Torresmo'                  : 'Farofa Nobre de Torresmo.png',

  /* ––– GELEIAS ––– */
  'Geleia de Pimenta Vermelha UAI'             : 'Geleia de Pimenta Vermelha UAI.png',
  'Geleia de Pimenta com Abacaxi UAI'          : 'Geleia de Pimenta com Abacaxi UAI.png',
  'Geleia de Pimenta com Damasco UAI'          : 'Geleia de Pimenta com Damasco UAI.png',

  /* ––– GOIABADAS & COCADAS ––– */
  'Goiabada Cremosa Artesanal'                 : 'Goiabada Cremosa Artesanal.png',
  'Goiabada Redonda Artesanal'                 : 'Goiabada Redonda Artesanal.png',
  'Cocada Cremosa A minha Cocada'              : 'Cocada Cremosa Aminha Cocada.png',

  /* ––– DOCE DE LEITE (balas/cubinhos) ––– */
  'Bala de Doce de Leite Conquista'            : 'Bala de Doce de Leite Conquista.png',
  'Doce de Leite cubinhos Famoso'              : 'Doce de Leite Famoso.png',
  'Doce de Leite cubinhos Tropical'            : 'Doce de Leite Tropical.png',

  /* ––– SALAMES ––– */
  'Salame Nobre Defumado Pimenta Biquinho'     : 'Salame Defumado com Pimenta Biquinho.png',
  'Salame Nobre Defumado Pimenta Calabresa'    : 'Salame Defumado com Pimenta Calabresa.png',
  'Salame Nobre Defumado com Azeitona'         : 'Salame Defumado com Azeitona.png',
  'Salame Nobre Defumado Tradicional'          : 'Salame Tradicional Defumado.png',
  'Salame Tipo Italiano'                       : 'Salame Tipo Italiano.png',
  'Salame Tipo Italiano Curado (Redinha)'      : 'Salame Curado Grosso na Redinha.png',

  /* ––– QUEIJOS (exemplos) ––– */
  'Queijo Brie'                                : 'Queijo Brie.png',
  'Queijo Colonial Nobre (Inteiro)'            : 'Queijo Colonial Nobre Inteiro.png',
  'Queijo Gorgonzola'                          : 'Queijo Gorgonzola.png',
  'Kit Romeu e Julieta'                        : 'Queijo Duo Romeu e Julieta.png',
  'Queijo Minas Canastra Fresco (Inteiro)'     : 'Queijo Minas Canastra Fresco Inteiro.png',
  'Queijo Minas Canastra Fresco (metade)'      : 'Queijo Minas Canastra Fresco Metade.png',
  'Queijo Minas Canastra Meia Cura (Inteiro)'  : 'Queijo Minas Canastra Meia Cura Inteiro.png',
  'Queijo Minas Canastra Meia Cura (metade)'   : 'Queijo Minas Canastra Meia Cura Metade.png',
  'Queijo Nozinho Defumado'                    : 'Queijo Nozinho Defumado.png',
  'Queijo Nozinho Temperado'                   : 'Queijo Nozinho Temperado.png',
  'Queijo Nozinho Tradicional'                 : 'Queijo Nozinho Puro.png',
  'Queijo Palito Mussarela Defumado'           : 'Queijo Palito Defumado.png',
  'Queijo Palito Mussarela Puro'               : 'Queijo Palito Puro.png',
  'Queijo Palito Mussarela com Cheddar'        : 'Queijo Palito Puro com Cheddar.png',
  'Queijo Palito Mussarela Temperado'          : 'Queijo Palito Temperado.png',
  'Queijo Prato (Inteiro)'                     : 'Queijo Prato Inteiro.png',
  'Queijo Provolone Defumado'                  : 'Queijo Provolone Defumado GR.png',
  'Queijo Provolombo Defumado (Provolone Defumado Recheado com Lombo)'
                                              : 'Queijo Provolone Defumado Recheado com Lombo.png',
  'Queijo Provolone Temperado e Recheado com Lombo'
                                              : 'Queijo Provolone Temperado Recheado com Lombo.png',
  'Queijo Provolone Vermelho'                  : 'Queijo Provolone Vermelho GR.png',
  'Queijo Rocfor (Inteiro)'                    : 'Queijo Rocfor Inteiro.png',
  'Queijo Gouda (Pedaço)'                      : 'Queijo Tipo Gouda Cunha.png',
  'Queijo Trufado com Requeijão e Azeitona'     : 'Queijo Trufado com Azeitona (metade).png',
  'Queijo Trufado com Requeijão e Carne Desfiada': 'Queijo Trufado com Carne Desfiada (metade).png',
  'Queijo Trufado com Requeijão e Tomate Seco'  : 'Queijo Trufado com Tomate Seco (metade).png',
  'Queijo Twist (Inteiro)'                     : 'Queijo Twist Inteiro.png',

  /* ––– MOLHOS ––– */
  'Molho Agridoce Defumado de Pimenta Defumada UAI'
                                              : 'Molho de Pimenta Defumada UAI.png',
  'Molho Agridoce Defumado de Pimenta com Damasco'
                                              : 'Molho de Pimenta com Damasco Defumada UAI.png',

  /* ––– PROVOLETO / PROVOLONBO KITS ––– */
  'KIT Provoleto 4 Queijos (Defumado, Temperado, Branco e ao Vinho)'
                                              : 'Kit Provoleto (Defumado, Temperado, Branco e Vermelho).png',
  'KIT Provoleto (Defumado, Temperado ao Vinho e Lombo)'
                                              : 'Kit Provoleto com Lombo (Defumado, Temperado,Vermelho e Lombo).png',
  'Mini KIT Provoleto (Defumado, Temperado, Branco e ao Vinho)'
                                              : 'Mini Kit Provoleto (Defumado, Temperado, Branco e Vermelho).png',
  'Kit Provolombo'                             : 'Kit Trio Provolombo (Defumado, Temperado e Vermelho).png',
};

/** ❷  Aplica o mapa fixo somente aos produtos que AINDA não têm img_url */
async linkStaticPairs(): Promise<void> {

  // carrega registro único da tabela
  const { data: row, error } = await this.supabase
    .from(this.table)
    .select<'id, data'>('id, data')
    .single();
  if (error) throw error;

  const produtos = (row.data ?? []) as Array<{ name: string; img_url?: string }>;

  let changed = false;
  const gravados: string[] = [];
  const falhou  : string[] = [];

  produtos.forEach(p => {
    if (p.img_url) return;                      // já tinha imagem

    const file = this.staticPairs[p.name];
    if (!file) { falhou.push(p.name); return; } // não está no mapa

    p.img_url = this.publicUrl(file);
    gravados.push(p.name);
    changed = true;
  });

  console.table(gravados.map(n => ({ '✅ agora tem foto': n })));
  console.table(falhou  .map(n => ({ '🚫 ainda sem par': n })));

  if (!changed) {
    console.info('👉 Nada novo a gravar (tudo já estava linkado ou faltou no mapa).');
    return;
  }

  const { error: updErr } = await this.supabase
    .from(this.table)
    .update({ data: produtos })
    .eq('id', row.id);
  if (updErr) throw updErr;

  console.info(`✅ ${gravados.length} img_url gravados a partir do mapa fixo.`);
}

/* ───── 2. sincroniza imagens ───── */
/* ───── 2. Sincroniza imagens ───── */
async syncCatalogImages(): Promise<{
  vinculados: string[];   // produtos que receberam img_url
  semFoto:    string[];   // produtos ainda sem imagem
  naoUsados:  string[];   // arquivos do bucket sem uso
}> {

  /* 1. Lê o JSON da tabela ------------------------------------ */
  const { data: row, error } = await this.supabase
    .from(this.table)
    .select<'id, data'>('id, data')
    .single();
  if (error) throw error;

  const produtos = (row.data ?? []) as Array<{ name: string; img_url?: string }>;

  /* 2. Lê TODOS os arquivos do bucket -------------------------- */
  const files = await this.listAllFiles();           // FileObject[]
  type FindInfo = { file: string; k1: string; k2: string };

  const fInfos: FindInfo[] = files.map((f) => {
    const base = f.name.replace(/\.[^.]+$/, '');     // sem extensão
    const k1 = this.key(base);                       // key “exata”
    const k2 = this.key(
      base
        .split(/\s+/)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join(' ')
    );                                               // palavras ordenadas
    return { file: f.name, k1, k2 };
  });

  /* Índices de lookup ----------------------------------------- */
  const mapK1: Record<string, string> = {};
  const mapK2: Record<string, string> = {};
  fInfos.forEach((fi) => {
    mapK1[fi.k1] = fi.file;
    mapK2[fi.k2] = fi.file;
  });

  /* 3. Percorre produtos -------------------------------------- */
  const usados = new Set<string>();
  const vinculados: string[] = [];
  const semFoto: string[] = [];
  let   changed = false;

  produtos.forEach((p) => {
    if (p.img_url) return;                         // já tinha imagem

    const kProd = this.key(p.name);

    // A) key “exata”
    let path: string | undefined = mapK1[kProd];

    // B) mesmas palavras em ordem alfabética
    if (!path) {
      const kSort = this.key(
        p.name
          .split(/\s+/)
          .sort((a: string, b: string) => a.localeCompare(b))
          .join(' ')
      );
      path = mapK2[kSort];
    }

    // C) todos os tokens presentes em algum nome de arquivo
    if (!path) {
      const tokens = kProd.match(/[a-z0-9]+/g) ?? [];
      const hit = fInfos.find((fi) => tokens.every((t) => fi.k1.includes(t)));
      path = hit?.file;
    }

    // Resultado
    if (path) {
      p.img_url = this.publicUrl(path);
      vinculados.push(p.name);
      usados.add(path);
      changed = true;
    } else {
      semFoto.push(p.name);
    }
  });

  /* 4. Arquivos que não casaram ------------------------------- */
  const naoUsados = files
    .map((f) => f.name)
    .filter((name) => !usados.has(name));

  // Logs de auditoria (opcional)
  console.table(vinculados.map((n) => ({ '✅ vinculado': n })));
  console.table(semFoto   .map((n) => ({ '❌ sem foto': n })));
  console.table(naoUsados .map((n) => ({ '🗃️ arquivo solto': n })));

  /* 5. Persiste se algo mudou ---------------------------------- */
  if (changed) {
    const { error: upErr } = await this.supabase
      .from(this.table)
      .update({ data: produtos })
      .eq('id', row.id);
    if (upErr) throw upErr;

    console.info(`✅ img_url gravado para ${vinculados.length} produtos.`);
  } else {
    console.info('👉 Nenhuma imagem nova para relacionar.');
  }

  return { vinculados, semFoto, naoUsados };
}



}
