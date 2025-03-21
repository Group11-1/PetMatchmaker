export interface Photo {
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface Breed {
  primary: string;
  secondary: string | null;
  mixed: boolean;
  unknown: boolean;
}

export interface Contact {
  email: string;
  phone: string;
  address: Address;
}

export interface Address {
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface Pet {
  id: number;
  type: string;
  name: string;
  breeds: Breed;
  photos?: Photo[];
  primary_photo_cropped?: Photo;
  url: string;
  age: string;
  gender: string;
  size: string;
  description: string | null;
  status: string;
  contact: Contact;
}

export interface Breed {
  name: string;
  _links: {
    type: {
      href: string;
    };
  };
}
