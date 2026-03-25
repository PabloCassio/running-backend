import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RaceAttributes {
  id: number;
  name: string;
  description?: string | null;
  date: Date;
  location: string;
  distance: number; // in kilometers
  maxParticipants?: number | null;
  currentParticipants: number;
  registrationFee: number;
  categories?: any | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  organizerId: number;
  startTime?: string | null;
  endTime?: string | null;
  registrationOpen?: Date | null;
  registrationClose?: Date | null;
  routeMap?: string | null;
  rules?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RaceCreationAttributes extends Optional<RaceAttributes, 'id' | 'currentParticipants' | 'registrationFee' | 'status'> {}

class Race extends Model<RaceAttributes, RaceCreationAttributes> implements RaceAttributes {
  public id!: number;
  public name!: string;
  public description?: string | null;
  public date!: Date;
  public location!: string;
  public distance!: number;
  public maxParticipants?: number | null;
  public currentParticipants!: number;
  public registrationFee!: number;
  public categories?: any | null;
  public status!: 'draft' | 'published' | 'cancelled' | 'completed';
  public organizerId!: number;
  public startTime?: string | null;
  public endTime?: string | null;
  public registrationOpen?: Date | null;
  public registrationClose?: Date | null;
  public routeMap?: string | null;
  public rules?: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isFull(): boolean {
    return !!this.maxParticipants && this.currentParticipants >= this.maxParticipants;
  }

  public canJoin(): boolean {
    const now = new Date();
    const registrationClose = this.registrationClose ? new Date(this.registrationClose) : null;
    return (
      this.status === 'published' &&
      (!this.maxParticipants || this.currentParticipants < this.maxParticipants) &&
      (!registrationClose || now < registrationClose)
    );
  }

  public getTimeUntilStart(): number {
    const now = new Date();
    const date = new Date(this.date);
    return date.getTime() - now.getTime();
  }

  public toPublicJSON(): any {
    const values = Object.assign({}, this.get());
    
    // Add computed properties
    (values as any).isFull = this.isFull();
    (values as any).canJoin = this.canJoin();
    (values as any).timeUntilStart = this.getTimeUntilStart();
    
    return values;
  }
}

Race.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    distance: {
      type: DataTypes.FLOAT, // in kilometers
      allowNull: false,
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    registrationFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
    },
    categories: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
      defaultValue: 'draft',
      allowNull: false,
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    registrationOpen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    registrationClose: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    routeMap: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Race',
    tableName: 'Races',
    timestamps: true,
    indexes: [
      {
        fields: ['date']
      },
      {
        fields: ['location']
      },
      {
        fields: ['organizerId']
      },
      {
        fields: ['status']
      }
    ]
  }
);

export default Race;