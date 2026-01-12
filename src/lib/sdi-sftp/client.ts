/**
 * Client SFTP per SDI
 * Gestisce connessioni SFTP e upload/download file
 */

// @ts-ignore - ssh2-sftp-client doesn't have @types but includes types
import SftpClient from 'ssh2-sftp-client';

export interface SDISFTPConfig {
  host: string;
  port?: number;
  username: string;
  privateKey?: string;
  password?: string;
  testMode?: boolean;
}

export class SDISFTPClient {
  private client: SftpClient;
  private config: SDISFTPConfig;
  private connected: boolean = false;

  constructor(config: SDISFTPConfig) {
    this.config = config;
    this.client = new SftpClient();
  }

  /**
   * Connetti al server SFTP
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    const connectConfig: any = {
      host: this.config.host,
      port: this.config.port || 22,
      username: this.config.username,
    };

    if (this.config.privateKey) {
      connectConfig.privateKey = this.config.privateKey;
    } else if (this.config.password) {
      connectConfig.password = this.config.password;
    } else {
      throw new Error('PrivateKey o password richiesti per connessione SFTP');
    }

    await this.client.connect(connectConfig);
    this.connected = true;
  }

  /**
   * Disconnetti dal server SFTP
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.client.end();
    this.connected = false;
  }

  /**
   * Upload file su directory SDI
   * @param localPath Path locale del file
   * @param remotePath Path remoto (relativo alla root chroot)
   * @returns true se upload riuscito
   */
  async uploadFile(localPath: string, remotePath: string): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    await this.client.put(localPath, remotePath);
    return true;
  }

  /**
   * Upload file da buffer
   */
  async uploadBuffer(
    buffer: Buffer,
    remotePath: string
  ): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    await this.client.put(buffer, remotePath);
    return true;
  }

  /**
   * Download file da directory SDI
   */
  async downloadFile(remotePath: string): Promise<Buffer> {
    if (!this.connected) {
      await this.connect();
    }

    return await this.client.get(remotePath);
  }

  /**
   * Lista file in directory
   */
  async listFiles(remotePath: string): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    return await this.client.list(remotePath);
  }

  /**
   * Elimina file remoto
   */
  async deleteFile(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    await this.client.delete(remotePath);
    return true;
  }

  /**
   * Rinomina file remoto
   */
  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }

    await this.client.rename(oldPath, newPath);
    return true;
  }

  /**
   * Ottiene path directory upload in base a testMode
   */
  getUploadDirectory(): string {
    return this.config.testMode ? 'DatiVersoSdITest' : 'DatiVersoSdI';
  }

  /**
   * Ottiene path directory download in base a testMode
   */
  getDownloadDirectory(): string {
    return this.config.testMode ? 'DatiDaSdITest' : 'DatiDaSdI';
  }
}

