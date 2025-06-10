import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GPXForm from '../GPXForm';

// Mock the GPX generation functions
jest.mock('@/lib/gpx', () => ({
  generateGpx: jest.fn(() => 'mock-gpx-content'),
  downloadGpx: jest.fn(),
  formatDuration: jest.fn((seconds) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
}));

const mockCoordinates: [number, number][] = [
  [-73.9857, 40.7829],
  [-73.9737, 40.7849],
  [-73.9737, 40.7809],
  [-73.9857, 40.7829],
];

describe('GPXForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with default values', () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    expect(screen.getByDisplayValue(/Route \d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Run')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    const nameInput = screen.getByLabelText(/route name/i);
    await user.clear(nameInput);
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Route name is required')).toBeInTheDocument();
    });
  });

  it('validates speed ranges for running', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    const speedInput = screen.getByLabelText(/running speed/i);
    await user.clear(speedInput);
    await user.type(speedInput, '100');
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/speed is outside realistic range/i)).toBeInTheDocument();
    });
  });

  it('validates speed ranges for cycling', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    // Change to cycling
    const activitySelect = screen.getByRole('combobox');
    await user.click(activitySelect);
    await user.click(screen.getByText('🚴 Cycling'));
    
    const speedInput = screen.getByLabelText(/cycling speed/i);
    await user.clear(speedInput);
    await user.type(speedInput, '2');
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/speed is outside realistic range/i)).toBeInTheDocument();
    });
  });

  it('switches between speed and pace input', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    // Initially should show speed input
    expect(screen.getByLabelText(/running speed/i)).toBeInTheDocument();
    
    // Switch to pace
    const paceRadio = screen.getByLabelText(/average pace/i);
    await user.click(paceRadio);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/running pace/i)).toBeInTheDocument();
    });
  });

  it('converts speed to pace when switching input types', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    // Set speed to 12 km/h
    const speedInput = screen.getByLabelText(/running speed/i);
    await user.clear(speedInput);
    await user.type(speedInput, '12');
    
    // Switch to pace
    const paceRadio = screen.getByLabelText(/average pace/i);
    await user.click(paceRadio);
    
    await waitFor(() => {
      const paceInput = screen.getByLabelText(/running pace/i);
      expect(paceInput).toHaveValue(5); // 60/12 = 5 min/km
    });
  });

  it('shows preview with estimated duration', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    await waitFor(() => {
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      expect(screen.getByText(/distance: 2.5 km/i)).toBeInTheDocument();
      expect(screen.getByText(/duration:/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when no coordinates', () => {
    render(<GPXForm coordinates={[]} distance={0} />);
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/please create a route with at least 2 points/i)).toBeInTheDocument();
  });

  it('calls onSubmit callback when form is submitted', async () => {
    const mockOnSubmit = jest.fn();
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/Route \d{1,2}\/\d{1,2}\/\d{4}/),
          activityType: 'Run',
          inputType: 'speed',
          averageSpeedKmh: 10,
          coordinates: mockCoordinates,
          distance: 2.5,
        })
      );
    });
  });

  it('validates description length', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    const descriptionInput = screen.getByLabelText(/description/i);
    const longDescription = 'a'.repeat(501);
    await user.type(descriptionInput, longDescription);
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/description must be less than 500 characters/i)).toBeInTheDocument();
    });
  });

  it('validates name length', async () => {
    render(<GPXForm coordinates={mockCoordinates} distance={2.5} />);
    
    const nameInput = screen.getByLabelText(/route name/i);
    const longName = 'a'.repeat(101);
    await user.clear(nameInput);
    await user.type(nameInput, longName);
    
    const submitButton = screen.getByRole('button', { name: /generate & download gpx/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/route name must be less than 100 characters/i)).toBeInTheDocument();
    });
  });
});
