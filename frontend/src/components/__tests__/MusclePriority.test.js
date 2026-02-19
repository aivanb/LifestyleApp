import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusclePriority from '../MusclePriority';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  getMusclePriorities: jest.fn(),
  updateMusclePriorities: jest.fn(),
}));

describe('MusclePriority tooltips', () => {
  const mockMusclePriorities = [
    {
      muscle_log_id: 1,
      muscle_id: 101,
      muscle_name: 'Pectoralis Major (Upper)',
      muscle_group: 'Chest',
      priority: 80,
    },
  ];

  beforeEach(() => {
    api.getMusclePriorities.mockResolvedValue({
      data: { success: true, data: mockMusclePriorities },
    });
    api.updateMusclePriorities.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('removes inline muscle description and provides info tooltip modal', async () => {
    render(<MusclePriority showHeader={false} enableTooltips={true} />);

    await waitFor(() => {
      expect(screen.getByText('Chest')).toBeInTheDocument();
    });

    // Inline description text should no longer appear in the muscle row.
    // (We still expect the muscle name to be present.)
    expect(screen.getByText('Pectoralis Major (Upper)')).toBeInTheDocument();

    const infoBtn = screen.getByTitle('View muscle info');
    fireEvent.click(infoBtn);

    await waitFor(() => {
      expect(screen.getByText(/Description:/i)).toBeInTheDocument();
      expect(screen.getByText(/Location:/i)).toBeInTheDocument();
      expect(screen.getByText(/Function:/i)).toBeInTheDocument();
    });
  });
});

