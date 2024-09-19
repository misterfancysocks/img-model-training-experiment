'use server'

import { getAllCostumes, getCostumeById, createCostume } from '@/db/queries/example-queries';
import { ActionState } from '@/types/action-types';
import { Costume } from '@/db/schema';

export async function getAllCostumesAction(): Promise<ActionState> {
  try {
    const costumes = await getAllCostumes();
    return { status: 'success', message: 'Costumes retrieved successfully', data: costumes };
  } catch (error) {
    return { status: 'error', message: 'Failed to retrieve costumes' };
  }
}

export async function getCostumeByIdAction(id: number): Promise<ActionState> {
  try {
    const costume = await getCostumeById(id);
    if (costume) {
      return { status: 'success', message: 'Costume retrieved successfully', data: costume };
    } else {
      return { status: 'error', message: 'Costume not found' };
    }
  } catch (error) {
    return { status: 'error', message: 'Failed to retrieve costume' };
  }
}

export async function createCostumeAction(costume: Omit<Costume, 'id' | 'created_at' | 'updated_at'>): Promise<ActionState> {
  try {
    const newCostume = await createCostume(costume);
    return { status: 'success', message: 'Costume created successfully', data: newCostume };
  } catch (error) {
    return { status: 'error', message: 'Failed to create costume' };
  }
}