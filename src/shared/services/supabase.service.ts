// shared/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../Environment/environment';

export interface Prod {
  id          : string;     // ← slug do nome
  name        : string;
  price_cents : number;
  categoria   : string;
  img_url?    : string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey,
    { auth: { persistSession:false, autoRefreshToken:false } }
  );
  private table = 'all_products_emporio_json';

  /* ───────── utilidades ───────── */
  private normalizar(s = ''): string {
    return s
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/\(.*?\)/g, '')                          // descarta parênteses
      .replace(/[^\w\s-]/g, '')                         // só letras/números
      .trim()
      .replace(/\s+/g, '-');                            // espaços → hífen
  }

  private categorizar(nome = ''): string {
    const n = nome.toLowerCase();
    if (/(queijo|provol|parmes|cheddar|gouda|canastra|coalho)/.test(n)) return 'Queijos';
    if (/(café|cafe)/.test(n))                                         return 'Café';
    if (/(geleia|goiabada|cocada)/.test(n))                            return 'Geleias & Doces';
    if (/doce/.test(n))                                                return 'Doces';
    if (/(vinho|cachaça|cachaca)/.test(n))                             return 'Bebidas';
    if (/(farofa|torresmo|salame|salaminho)/.test(n))                  return 'Petiscos';
    return 'Outros';
  }

  /* ───────── catálogo somente leitura ───────── */
  async getCatalog(): Promise<Prod[]> {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('data')
      .single();
    if (error) throw error;

    const arr = (data?.data ?? []) as any[];

    /* mapeia cada item → Prod */
    const mapa: Record<string, number> = {}; // p/ garantir id único
    return arr.map((p) => {
      let slug = this.normalizar(p.name);
      // se houver dois itens com mesmo slug, adiciona sufixo -2, -3…
      if (mapa[slug]) slug = `${slug}-${++mapa[slug]}`;
      else mapa[slug] = 1;

      return {
        id          : slug,
        name        : p.name ?? '',
        price_cents : Math.round((p.price ?? 0) * 100),
        categoria   : this.categorizar(p.name),
        img_url     : p.img_url ?? ''
      };
    });
  }
}
