import { InputTextModule }   from 'primeng/inputtext';
import { DropdownModule }    from 'primeng/dropdown';
import { ButtonModule }      from 'primeng/button';
import { BadgeModule }       from 'primeng/badge';
import { DialogModule }      from 'primeng/dialog';
import { PaginatorModule }   from 'primeng/paginator';
import { CardModule }        from 'primeng/card'; // Adicionar CardModule
import { ToolbarModule }     from 'primeng/toolbar'; // Adicionar ToolbarModule
import { IconFieldModule }   from 'primeng/iconfield'; // Adicionar IconFieldModule
import { InputIconModule }   from 'primeng/inputicon'; // Adicionar InputIconModule
import { AvatarModule }      from 'primeng/avatar'; // Opcional, para placeholder de imagem
import { SupabaseService, Prod } from '../../shared/services/supabase.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton'; // Adicionar SelectButtonModule

const WEBHOOKS: Record<'pix'|'credit'|'debit',string> = {
  pix:'https://exemplo.com/pix',
  credit:'https://exemplo.com/credit',
  debit:'https://exemplo.com/debit'
};
const WEBHOOK_GERAL = 'https://n8n.grupobeely.com.br/webhook/f6db1139-6946-4034-9c4c-dd1ebd07d1e4';


@Component({
  selector   : 'app-catalog',
  standalone : true,
  imports    : [
    CommonModule, FormsModule, CurrencyPipe,SelectButtonModule,
    InputTextModule, DropdownModule, ButtonModule,
    BadgeModule, DialogModule, PaginatorModule,
    CardModule, ToolbarModule, IconFieldModule, InputIconModule, AvatarModule // Adicionar módulos aqui
  ],
  templateUrl: './catalog.component.html',
  styleUrls  : ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {

  /* dados */
  all:Prod[]=[];           // lista completa
  filtered:Prod[]=[];      // após search/filter
  paged:Prod[]=[];         // página atual
  categories:string[]=['Todos'];
  payOptions = [
    { label:'PIX',     value:'pix',    icon:'pi pi-qrcode'},
    { label:'Crédito', value:'credit', icon:'pi pi-credit-card'},
    { label:'Débito',  value:'debit',  icon:'pi pi-wallet' }
  ];
  payMethod:'pix'|'credit'|'debit'|null = null; // Mantido para seleção no front-end

  /* estado UI */
  placeholder='assets/no-image.png';
  searchTerm = '';
  catFilter  = 'Todos';
  page       = 0;          // paginator é zero-based
  rows       = 12;         // itens por página

  cart:Record<string,number>={};
  showCart = false;

  showProductPreview = false; // Nova propriedade para controlar o modal de pré-visualização
  selectedProduct: Prod | null = null;

  constructor(private supa:SupabaseService){}

  /* getters para template */
  get cartKeys(){ return Object.keys(this.cart); }
  get total(){
    return Object.entries(this.cart)
      .reduce((s,[id,q])=>{
        const p=this.all.find(x=>x.id===id); return p?s+p.price_cents*q:s;
      },0);
  }

  /* ciclo de vida */
  async ngOnInit() {


/* Dentro de ngOnInit, logo depois de obter this.all */
this.all = await this.supa.getCatalog()

/* 1A) normaliza categoria (tira espaços extras) -------------------- */
this.all.forEach(p => p.categoria = (p.categoria ?? '').trim());

/* 1B) ordena para ficar tudo agrupado por categoria, depois por nome */
this.all.sort((a, b) => {
  const c = a.categoria.localeCompare(b.categoria, 'pt');
  return c !== 0 ? c : a.name.localeCompare(b.name, 'pt');
});

/* categorias únicas, já normalizadas */
this.categories = ['Todos', ...new Set(this.all.map(p => p.categoria))];
this.applyFilters();

  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();

    /* só filtra, sem reordenar — a ordenação já foi feita em ngOnInit */
    this.filtered = this.all.filter(p =>
      (this.catFilter === 'Todos' || p.categoria === this.catFilter) &&
      (!term || p.name.toLowerCase().includes(term))
    );

    this.onPageChange({ page: 0, rows: this.rows });
  }

  onPageChange(e:{page:number,rows:number}){
    this.page = e.page;
    this.rows = e.rows;
    const start = e.page * e.rows;
    this.paged  = this.filtered.slice(start,start+e.rows);
  }

  /* ───── CART ───── */
  add(id:string){ this.cart[id]=(this.cart[id]??0)+1; }
  sub(id:string){ if(--this.cart[id]<=0) delete this.cart[id]; }
  qty(id:string){ return this.cart[id]??0; }
  productName(id:string){ return this.all.find(p=>p.id===id)?.name||''; }

  /* modal */
/* quando abrir o modal, resetamos o método */
openCart(){
  this.payMethod = null;
  this.showCart  = true;
}  closeCart(){ this.showCart=false; }

  /* checkout */
// ...existing code...
  /* checkout */
// ...existing code...
  /* checkout */
  async checkout(method: 'pix' | 'credit' | 'debit') {
    if (!this.total || Object.keys(this.cart).length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const formattedExpirationDate = expirationDate.toISOString().split('T')[0];
    const productNamesInCart = Object.keys(this.cart)
    .map(id => this.all.find(p => p.id === id)?.name || 'Produto desconhecido')
    .join(', ');
    const payload = {
      description: `Pedido Empório Herman #${Date.now()}`,
      payment_method: method,
      product_names: productNamesInCart,
      expiration_date: formattedExpirationDate,
      amount: this.total,
      items: Object.entries(this.cart).map(([id, qty]) => {
        const product = this.all.find(p => p.id === id);
        return {
          id: id,
          name: product?.name || 'Produto desconhecido',
          quantity: qty,
          unit_price: product ? product.price_cents : 0
        };
      })
    };

    try {
      const response = await fetch(WEBHOOK_GERAL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

            // ...existing code...
                      // ...existing code...
                        if (response.ok) {
                          const responseData = await response.json(); // A resposta é um OBJETO, não um array
                          // Log detalhado para ajudar na depuração
                          console.log('Resposta completa recebida do webhook (status OK):', JSON.stringify(responseData, null, 2));

                          let redirectLink: string | null = null;
                          let processedMessage: string | null = null;

                          // Tenta extrair informações diretamente do objeto de resposta
                          if (responseData) { // Verifica se responseData existe
                            if (responseData.response && typeof responseData.response.full_url === 'string' && responseData.response.full_url.length > 0) {
                              redirectLink = responseData.response.full_url;
                            } else if (responseData.status === "OK") {
                              // Se o status interno for OK, mas não encontramos um full_url, usamos a mensagem.
                              processedMessage = responseData.message || 'Pedido processado com sucesso (status OK), mas sem link de redirecionamento explícito.';
                            }
                          }

                          if (redirectLink) {
                            alert('Pedido enviado! Você será redirecionado para o pagamento.');
                            this.cart = {};
                            this.closeCart();
                            window.location.href = redirectLink;
                          } else if (processedMessage) {
                            alert(processedMessage); // Exibe a mensagem de sucesso/processamento
                            this.cart = {};
                            this.closeCart();
                          } else {
                            // Se chegou aqui, response.ok era true, mas não foi possível extrair um link válido nem uma mensagem de status OK.
                            console.error('Formato de resposta inesperado ou informações cruciais ausentes, mesmo com response.ok:', responseData);
                            alert('Pedido enviado, mas houve um problema ao interpretar a resposta do servidor de pagamento. Por favor, contate o suporte.');
                            this.cart = {};
                            this.closeCart();
                          }
                        } else {
            // ...existing code...
      // ...existing code...
        let errorMessage = 'Falha no envio do pedido.';
        try {
          const errorData = await response.json();
          // Se errorData for um array, tenta pegar a mensagem do primeiro elemento
          if (Array.isArray(errorData) && errorData.length > 0) {
            errorMessage += ` Detalhes: ${errorData[0].message || JSON.stringify(errorData[0])}`;
          } else {
            errorMessage += ` Detalhes: ${errorData.message || JSON.stringify(errorData)}`;
          }
        } catch (e) {
          errorMessage += ` Status: ${response.status} - ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      alert('Ocorreu um erro ao tentar processar seu pedido. Tente novamente mais tarde.');
    }
  }

// ...existing code...

// ...existing code...

    /* Modal de Pré-visualização do Produto */
    openProductPreview(product: Prod) {
      this.selectedProduct = product;
      this.showProductPreview = true;
    }

    closeProductPreview() {
      this.showProductPreview = false;
      this.selectedProduct = null;
  }
  addProductFromPreview() {
    if (this.selectedProduct) {
      this.add(this.selectedProduct.id);
      // Opcional: fechar o modal de preview após adicionar ao carrinho
      // this.closeProductPreview();
    }
  }

}
