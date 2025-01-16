import { useEffect, useRef } from 'react';

interface AddressComponents {
  street_number: string;
  route: string;
  locality: string;
  postal_code: string;
  country: string;
}

interface UseGooglePlacesAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void;
}

// European country codes
const europeanCountries = [
  'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 
  'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 
  'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'gb', 'is', 'li', 
  'no', 'ch', 'al', 'ba', 'mk', 'me', 'rs', 'tr'
];

// Singleton to manage Google Maps API loading
const googleMapsLoader = {
  isLoading: false,
  isLoaded: false,
  callbacks: [] as (() => void)[],

  load() {
    if (window.google) {
      this.isLoaded = true;
      return Promise.resolve();
    }

    if (this.isLoading) {
      return new Promise<void>(resolve => {
        this.callbacks.push(resolve);
      });
    }

    this.isLoading = true;

    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCPHu_AM_K0K6uHAHxnKjsuZFgqI1E5dQI&libraries=places&language=de`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isLoaded = true;
        this.isLoading = false;
        this.callbacks.forEach(callback => callback());
        this.callbacks = [];
        resolve();
      };
      document.head.appendChild(script);
    });
  }
};

export function useGooglePlacesAutocomplete({ onAddressSelect }: UseGooglePlacesAutocompleteProps) {
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const initAutocomplete = () => {
      if (!inputRef.current) return;

      autoCompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: europeanCountries }, // Allow all European countries
        fields: ['address_components'],
        types: ['address'],
        language: 'de'
      });

      autoCompleteRef.current.addListener('place_changed', () => {
        const place = autoCompleteRef.current?.getPlace();
        
        if (!place?.address_components) return;

        const addressComponents: AddressComponents = {
          street_number: '',
          route: '',
          locality: '',
          postal_code: '',
          country: ''
        };

        place.address_components.forEach(component => {
          const type = component.types[0];
          if (type === 'street_number') {
            addressComponents.street_number = component.long_name;
          }
          if (type === 'route') {
            addressComponents.route = component.long_name;
          }
          if (type === 'locality') {
            addressComponents.locality = component.long_name;
          }
          if (type === 'postal_code') {
            addressComponents.postal_code = component.long_name;
          }
          if (type === 'country') {
            addressComponents.country = component.long_name;
          }
        });

        onAddressSelect(addressComponents);
      });
    };

    googleMapsLoader.load().then(initAutocomplete);

    return () => {
      if (autoCompleteRef.current) {
        google.maps.event.clearInstanceListeners(autoCompleteRef.current);
      }
    };
  }, [onAddressSelect]);

  return inputRef;
}