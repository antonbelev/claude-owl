import https from 'https';
import type {
  ServiceStatus,
  ServiceStatusLevel,
  ServiceIncident,
  ServiceIncidentUpdate,
} from '../../shared/types/ipc.types';

const RSS_FEED_URL = 'https://status.claude.com/history.rss';
const STATUS_PAGE_URL = 'https://status.claude.com';

export class StatusService {
  private cachedStatus: ServiceStatus | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch the current service status from Claude status page RSS feed
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    console.log('[StatusService] Fetching service status');

    // Return cached status if still valid
    const now = Date.now();
    if (this.cachedStatus && now - this.lastFetchTime < this.CACHE_DURATION_MS) {
      console.log('[StatusService] Returning cached status');
      return this.cachedStatus;
    }

    try {
      console.log('[StatusService] Fetching RSS feed from:', RSS_FEED_URL);
      const rssContent = await this.fetchRSS(RSS_FEED_URL);
      const incidents = this.parseRSS(rssContent);

      // Filter incidents from the last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const recentIncidents = incidents.filter((incident) => {
        const incidentDate = new Date(incident.publishedAt);
        return incidentDate >= threeDaysAgo;
      });

      console.log('[StatusService] Found', recentIncidents.length, 'recent incidents (last 3 days)');

      // For status level determination, only consider unresolved incidents
      // Resolved incidents are historical and don't affect current status
      const unresolvedIncidents = recentIncidents.filter((incident) => !incident.resolved);
      console.log('[StatusService] Unresolved incidents:', unresolvedIncidents.length);

      // Determine overall status level based on unresolved incidents only
      const level = this.determineStatusLevel(unresolvedIncidents);

      const status: ServiceStatus = {
        level,
        message: this.getStatusMessage(level, recentIncidents),
        lastChecked: new Date().toISOString(),
        recentIncidents,
      };

      // Cache the result
      this.cachedStatus = status;
      this.lastFetchTime = now;

      console.log('[StatusService] Service status determined:', level);
      return status;
    } catch (error) {
      console.error('[StatusService] Failed to fetch service status:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return unknown status on error
      return {
        level: 'unknown',
        message: 'Unable to fetch service status',
        lastChecked: new Date().toISOString(),
        recentIncidents: [],
      };
    }
  }

  /**
   * Fetch RSS feed content via HTTPS
   */
  private fetchRSS(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('[StatusService] Making HTTPS request to RSS feed');
      https
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            console.log('[StatusService] RSS feed fetched successfully');
            resolve(data);
          });
        })
        .on('error', (err) => {
          console.error('[StatusService] HTTPS request failed:', err.message);
          reject(err);
        });
    });
  }

  /**
   * Parse RSS XML content into ServiceIncident objects
   */
  private parseRSS(xmlContent: string): ServiceIncident[] {
    console.log('[StatusService] Parsing RSS XML content');
    const incidents: ServiceIncident[] = [];

    // Simple XML parsing (extract <item> elements)
    const itemMatches = xmlContent.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemXml = match[1];
      if (!itemXml) continue;

      const title = this.extractTag(itemXml, 'title');
      const link = this.extractTag(itemXml, 'link');
      const pubDate = this.extractTag(itemXml, 'pubDate');
      const description = this.extractTag(itemXml, 'description');
      const guid = this.extractTag(itemXml, 'guid');

      if (!title || !link || !pubDate || !guid) continue;

      const updates = this.parseIncidentUpdates(description || '');
      const resolved = this.isIncidentResolved(updates);

      incidents.push({
        id: guid,
        title: this.decodeHTML(title),
        url: link,
        publishedAt: new Date(pubDate).toISOString(),
        updates,
        resolved,
      });
    }

    console.log('[StatusService] Parsed', incidents.length, 'incidents from RSS feed');
    return incidents;
  }

  /**
   * Extract content from XML tag
   */
  private extractTag(xml: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim();
  }

  /**
   * Parse incident updates from description HTML
   */
  private parseIncidentUpdates(descriptionHtml: string): ServiceIncidentUpdate[] {
    const updates: ServiceIncidentUpdate[] = [];

    // Remove CDATA wrapper if present
    const html = descriptionHtml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');

    // Try pattern 1: <strong>Status</strong> - message <br> <small>timestamp</small>
    // This handles: <strong>Resolved</strong> - Between 17:20... <br><small>Nov 7, 22:47 UTC</small>
    const pattern1 = /<strong>([^<]+)<\/strong>\s*-?\s*([^<]*?)(?:<br\s*\/?>|<p>)\s*<small>([^<]+)<\/small>/gi;
    const matches1 = Array.from(html.matchAll(pattern1));

    if (matches1.length > 0) {
      for (const m of matches1) {
        const status = m[1]?.trim();
        const message = m[2]?.trim();
        const timestamp = m[3]?.trim();

        if (status && timestamp) {
          updates.push({
            status,
            message: this.decodeHTML(message || status),
            timestamp: this.parseTimestamp(timestamp),
          });
        }
      }
    }

    // If no updates found, try pattern 2: Look for any <strong> tag which might be a status
    // and extract everything else as message
    if (updates.length === 0) {
      const strongMatches = Array.from(html.matchAll(/<strong>([^<]+)<\/strong>/gi));

      for (const m of strongMatches) {
        const status = m[1]?.trim();

        if (status && (status.toLowerCase().includes('resolved') || status.toLowerCase().includes('investigating'))) {
          // Found a status marker, extract surrounding text
          const afterStatus = html.substring((m.index || 0) + m[0].length);

          // Extract timestamp from <small> tags
          const smallMatch = html.match(/<small>([^<]+)<\/small>/i);
          const timestamp = smallMatch?.[1]?.trim() || '';

          // Get message (everything that's not HTML tags)
          const message = afterStatus
            .split(/(?:<br\s*\/?|<small>|<\/small>|<p>|<\/p>)/)[0]
            ?.replace(/<[^>]+>/g, ' ')
            .trim();

          if (status && timestamp) {
            updates.push({
              status,
              message: this.decodeHTML(message || status),
              timestamp: this.parseTimestamp(timestamp),
            });
            break;
          }
        }
      }
    }

    // If no updates found, try to extract any text as a single update
    if (updates.length === 0 && html) {
      const textContent = html.replace(/<[^>]+>/g, ' ').trim();
      if (textContent) {
        updates.push({
          status: 'Update',
          message: this.decodeHTML(textContent),
          timestamp: new Date().toISOString(),
        });
      }
    }

    return updates;
  }

  /**
   * Parse timestamp from RSS format
   */
  private parseTimestamp(timestamp: string): string {
    try {
      // Try to parse common formats
      const date = new Date(timestamp);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Check if incident is resolved
   */
  private isIncidentResolved(updates: ServiceIncidentUpdate[]): boolean {
    if (updates.length === 0) return false;

    // Check if any update contains "Resolved" in status or message
    for (const update of updates) {
      const statusLower = (update.status || '').toLowerCase();
      const messageLower = (update.message || '').toLowerCase();
      if (statusLower.includes('resolved') || messageLower.includes('resolved')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine overall service status level
   */
  private determineStatusLevel(incidents: ServiceIncident[]): ServiceStatusLevel {
    if (incidents.length === 0) {
      return 'operational';
    }

    // Check for unresolved incidents
    const unresolvedIncidents = incidents.filter((inc) => !inc.resolved);

    if (unresolvedIncidents.length === 0) {
      // All recent incidents are resolved
      return 'operational';
    }

    // Check severity based on keywords
    for (const incident of unresolvedIncidents) {
      const titleLower = incident.title?.toLowerCase() || '';
      const latestUpdate = incident.updates?.[0];
      const statusLower = latestUpdate?.status?.toLowerCase() || '';

      // Outage indicators
      if (
        titleLower.includes('unavailable') ||
        titleLower.includes('outage') ||
        titleLower.includes('down')
      ) {
        return 'outage';
      }

      // Maintenance indicators
      if (titleLower.includes('maintenance') || statusLower.includes('maintenance')) {
        return 'maintenance';
      }

      // Degraded performance indicators
      if (
        titleLower.includes('elevated') ||
        titleLower.includes('degraded') ||
        titleLower.includes('slow') ||
        titleLower.includes('error')
      ) {
        return 'degraded';
      }
    }

    // Default to degraded if there are unresolved incidents
    return 'degraded';
  }

  /**
   * Get human-readable status message
   */
  private getStatusMessage(level: ServiceStatusLevel, incidents: ServiceIncident[]): string {
    switch (level) {
      case 'operational':
        if (incidents.length > 0) {
          return 'All systems operational (recent issues resolved)';
        }
        return 'All systems operational';

      case 'degraded':
        return 'Some systems experiencing issues';

      case 'outage':
        return 'Service disruption in progress';

      case 'maintenance':
        return 'Scheduled maintenance in progress';

      case 'unknown':
      default:
        return 'Status unavailable';
    }
  }

  /**
   * Decode HTML entities
   */
  private decodeHTML(html: string): string {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }

  /**
   * Get the status page URL
   */
  getStatusPageUrl(): string {
    return STATUS_PAGE_URL;
  }
}
