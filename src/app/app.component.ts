import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';

//  Tell TypeScript about the global Google object
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

  markerOptions: google.maps.MarkerOptions = { animation: google.maps.Animation.DROP };

  photoUrl: string = '';

  nearbyActivities: { name: string; vicinity: string }[] = [];

  constructor() {}

  private getNearbyAttractions(lat: number, lng: number) {
    if (!google?.maps?.places?.PlacesService) {
      this.nearbyActivities = [{ name: 'Places Service not loaded.', vicinity: '' }];
      return;
    }

    const tempMap = new google.maps.Map(document.createElement('div'));
    const placesService = new google.maps.places.PlacesService(tempMap);

    const request = {
      location: new google.maps.LatLng(lat, lng),
      radius: 5000,
      type: ['tourist_attraction', 'park', 'museum', 'restaurant', 'shopping_mall'],
      rankby: google.maps.places.RankBy.PROMINENCE,
    };

    placesService.nearbySearch(request, (results: any, status: string) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        this.nearbyActivities = results.slice(0, 5).map((place: any) => ({
          name: place.name,
          vicinity: place.vicinity,
        }));
      } else {
        this.nearbyActivities = [
          { name: 'Could not find any fun activities nearby.', vicinity: '' },
        ];
      }
    });
  }

  private updatePlace(lat: number, lng: number, name: string, address: string, placePhoto?: any) {
    this.center = { lat, lng };
    this.markerPosition = this.center;
    this.zoom = 14;

    this.photoUrl = placePhoto
      ? placePhoto.getUrl({ maxWidth: 600, maxHeight: 400 })
      : 'https://source.unsplash.com/600x400/?city';

    this.formattedInfo = name || address.split(',')[0] || 'city';

    // Set infoContent for the map info-window
    this.infoContent = `<strong>${name}</strong><br>${address}`;

    this.getNearbyAttractions(lat, lng);
  }

  ngAfterViewInit() {
    // Small delay ensures DOM element exists
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
          firstPhoto
        );
      });
    }, 500); // Added safety delay
  }

  //  Implemented required method for map clicks
  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng || !google?.maps?.Geocoder) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Reverse Geocode the location to get an address/name for the info-window
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

      this.updatePlace(lat, lng, name, address, undefined);
    });
  }

  // Placeholder for manual search if user presses enter
  onManualSearch(): void {
    console.log('Manual search triggered (Autcomplete is generally preferred for best results).');
  }
}
