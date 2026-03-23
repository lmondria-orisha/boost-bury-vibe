export interface TweakwiseResponse {
  facets: Facet[];
  items: Product[];
}

export interface Facet {
  facetsettings: {
    facetid: number;
    title: string;
    isvisible: boolean;
    attributename: string;
    urlkey: string;
    iscollapsible: boolean;
    iscollapsed: boolean;
    ismultiselect: boolean;
    selectiontype: string;
  };
  attributes: FacetAttribute[];
}

export interface FacetAttribute {
  title: string;
  isselected: boolean;
  nrofresults: number;
  attributeid: string;
  url: string;
  link: string;
  children: FacetAttribute[] | null;
}

export interface Product {
  type: string;
  itemno: string;
  title: string;
  price: number;
  brand: string;
  image: string;
  url: string;
  attributes: Attribute[];
  visualproperties: {
    colspan: number;
    rowspan: number;
  };
  debug?: {
    boostBury?: {
      rankdelta: number;
      boosted: boolean;
      buried: boolean;
    };
  };
}

export interface Attribute {
  name: string;
  values?: string[];
}
