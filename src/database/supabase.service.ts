import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../config/supabase.config';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
