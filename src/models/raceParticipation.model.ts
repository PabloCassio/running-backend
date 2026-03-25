import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RaceParticipationAttributes {
  id: string;
  raceId: string;
  userId: string;
  status: 'registered' | 'started' | 'in_progress' | 'completed' | 'dnf' | 'disqualified';
  startTime?: Date | null;
  endTime?: Date | null;
  totalTime?: number | null; // in seconds
  averagePace?: number | null; // in min/km
  distanceCovered: number; // in kilometers
  position?: number | null;
  caloriesBurned?: number | null;
  averageHeartRate?: number | null;
  maxHeartRate?: number | null;
  elevationGain?: number | null;
  gpsData?: any[] | null;
  checkpoints?: any[] | null;
  deviceInfo?: any | null;
  isVerified: boolean;
  verificationScore: number;
  notes?: string | null;
  metadata?: any | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RaceParticipationCreationAttributes extends Optional<RaceParticipationAttributes, 'id' | 'distanceCovered' | 'isVerified' | 'verificationScore'> {}

class RaceParticipation extends Model<RaceParticipationAttributes, RaceParticipationCreationAttributes> implements RaceParticipationAttributes {
  public id!: string;
  public raceId!: string;
  public userId!: string;
  public status!: 'registered' | 'started' | 'in_progress' | 'completed' | 'dnf' | 'disqualified';
  public startTime?: Date | null;
  public endTime?: Date | null;
  public totalTime?: number | null;
  public averagePace?: number | null;
  public distanceCovered!: number;
  public position?: number | null;
  public caloriesBurned?: number | null;
  public averageHeartRate?: number | null;
  public maxHeartRate?: number | null;
  public elevationGain?: number | null;
  public gpsData?: any[] | null;
  public checkpoints?: any[] | null;
  public deviceInfo?: any | null;
  public isVerified!: boolean;
  public verificationScore!: number;
  public notes?: string | null;
  public metadata?: any | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public calculatePace(): number | null {
    if (!this.totalTime || !this.distanceCovered || this.distanceCovered === 0) {
      return null;
    }
    // Convert seconds to minutes and divide by distance in km
    return (this.totalTime / 60) / this.distanceCovered;
  }

  public getProgressPercentage(raceDistance: number): number {
    if (!raceDistance || raceDistance === 0) {
      return 0;
    }
    return Math.min(100, (this.distanceCovered / raceDistance) * 100);
  }

  public isFinished(): boolean {
    return ['completed', 'dnf', 'disqualified'].includes(this.status);
  }

  public toPublicJSON(): any {
    const values = Object.assign({}, this.get());
    delete values.gpsData;
    delete values.deviceInfo;
    delete values.metadata;
    delete values.createdAt;
    delete values.updatedAt;
    
    // Add computed properties
    (values as any).pace = this.calculatePace();
    
    return values;
  }
}

RaceParticipation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    raceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'races',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('registered', 'started', 'in_progress', 'completed', 'dnf', 'disqualified'),
      defaultValue: 'registered',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalTime: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    averagePace: {
      type: DataTypes.FLOAT, // in min/km
      allowNull: true,
    },
    distanceCovered: {
      type: DataTypes.FLOAT, // in kilometers
      defaultValue: 0,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    caloriesBurned: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    averageHeartRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maxHeartRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    elevationGain: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    gpsData: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    checkpoints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'RaceParticipation',
    tableName: 'race_participations',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['raceId', 'userId']
      },
      {
        fields: ['raceId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['position']
      },
      {
        fields: ['totalTime']
      }
    ]
  }
);

export default RaceParticipation;