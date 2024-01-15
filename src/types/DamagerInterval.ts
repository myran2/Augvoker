import { type Damager } from '@/types/Damager';
export { type Damager } from '@/types/Damager';

export type DamagerInterval = {
    start: number;
    end: number;
    damagers: Damager[];
}