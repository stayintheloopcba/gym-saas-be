import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'ok' | 'error';
  environment: string;
  uptime: number;
  timestamp: string;
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  public async check(): Promise<HealthStatus> {
    const database = await this.pingDatabase();
    return {
      status: database === 'up' ? 'ok' : 'error',
      environment: process.env.NODE_ENV ?? 'development',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    };
  }

  private pingDatabase(): Promise<'up' | 'down'> {
    return this.dataSource
      .query('SELECT 1')
      .then(() => 'up' as const)
      .catch(() => 'down' as const);
  }
}
