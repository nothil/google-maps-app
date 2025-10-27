import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './app.component.html',

  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('searchInput') autocompleteEl!: ElementRef;
  center = { lat: -29.8587, lng: 31.0218 };
  zoom = 12;
  markerPosition: any = null;
  infoContent = '';
  formattedInfo = '';
  infoWindowContent = '';
  photoUrls: string[] = [];

  markerOptions: google.maps.MarkerOptions = { animation: google.maps.Animation.DROP };

  nearbyActivities: {
    id?: string;
    name: string;
    vicinity: string;
    rating: number | string;
  }[] = [];

  constructor() {}

  private async getNearbyAttractions(lat: number, lng: number) {
    try {
      if (!google?.maps?.places?.Place) {
        this.nearbyActivities = [
          { name: 'Places API (new) not loaded.', vicinity: '', rating: '' },
        ];
        return;
      }

      const { Place, SearchNearbyRankPreference } = google.maps.places;

      const request = {
        fields: ['id', 'displayName', 'formattedAddress', 'rating', 'location'],
        locationRestriction: { center: { lat, lng }, radius: 5000 },
        includedTypes: ['tourist_attraction', 'park', 'museum', 'restaurant', 'cafe'],
        maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      const { places } = await Place.searchNearby(request);

      if (places && places.length > 0) {
        this.nearbyActivities = places.map((p: any) => {
          const primaryName = p.displayName?.text;
          const fallbackName =
            p.formattedAddress?.split(',')[0] || p.location?.toString() || 'Local Attraction';

          const finalName = primaryName ?? fallbackName;

          return {
            id: p.id ?? '',
            name: finalName,
            vicinity: p.formattedAddress ?? '',
            rating: p.rating ?? 'N/A',
          };
        });
      } else {
        this.nearbyActivities = [
          { name: 'No nearby fun activities found', vicinity: '', rating: '' },
        ];
      }
    } catch (error) {
      console.error('Error fetching nearby activities (new API):', error);
      this.nearbyActivities = [{ name: 'Error loading activities.', vicinity: '', rating: '' }];
    }
  }

  private updatePlace(
    lat: number,
    lng: number,
    name: string,
    address: string,
    placePhoto?: any,
    place?: any
  ) {
    this.center = { lat, lng };
    this.markerPosition = this.center;
    this.zoom = 14;

    this.formattedInfo = name || address.split(',')[0] || 'city';

    let photos: any[] = [];

    if (place?.photos?.length) {
      photos = place.photos.slice(0, 4);
      this.photoUrls = photos.map((p) => p.getUrl({ maxWidth: 600, maxHeight: 400 }));
    } else {
      this.photoUrls = [`https://source.unsplash.com/600x400/?${this.formattedInfo}`];
    }

    this.infoContent = `<strong>${name}</strong><br>${address}`;
    this.infoWindowContent = this.infoContent;

    this.getNearbyAttractions(lat, lng);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const input = this.autocompleteEl?.nativeElement;
      if (!input || !google?.maps?.places) {
        console.error('Google Maps Places library not loaded or input not found');
        return;
      }

      const autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ['geometry', 'formatted_address', 'name', 'photos'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          console.warn('No geometry returned for place');
          return;
        }

        const firstPhoto = place.photos && place.photos.length > 0 ? place.photos[0] : undefined;

        this.updatePlace(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
          place.name || place.formatted_address,
          place.formatted_address || '',
          place.photos && place.photos.length > 0 ? place.photos[0] : undefined,

          place
        );
      });
    }, 1000);
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng || !google?.maps?.Geocoder) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      let name = 'Clicked Location';
      let address = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

      if (status === 'OK' && results[0]) {
        name =
          results[0].address_components.find((c: any) => c.types.includes('locality'))?.long_name ||
          results[0].formatted_address.split(',')[0] ||
          name;
        address = results[0].formatted_address;
      }

      this.updatePlace(lat, lng, name, address, undefined, undefined);
    });
  }

  onManualSearch(): void {
    console.log('Manual search triggered (Autcomplete is generally preferred for best results).');
  }
}
