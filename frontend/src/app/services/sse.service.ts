import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  constructor(private _zone: NgZone) {}

  getServerSentEvent(url: string): Observable<MessageEvent> {
    return new Observable(observer => {
      // In a real app we'd attach a JWT token via cookies or url param. 
      // Assuming endpoint allows basic access for MVP.
      const eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onmessage = event => {
        this._zone.run(() => {
          observer.next(event);
        });
      };

      eventSource.onerror = error => {
        this._zone.run(() => {
          observer.error(error);
        });
      };

      return () => eventSource.close();
    });
  }
}
