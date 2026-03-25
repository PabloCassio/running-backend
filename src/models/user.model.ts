import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate?: Date | null;
  country?: string | null;
  city?: string | null;
  profileImage?: string | null;
  bio?: string | null;
  totalDistance: number;
  totalRaces: number;
  wins: number;
  personalBest5k?: number | null;
  personalBest10k?: number | null;
  personalBestHalfMarathon?: number | null;
  personalBestMarathon?: number | null;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date | null;
  role: 'user' | 'admin' | 'moderator';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'totalDistance' | 'totalRaces' | 'wins' | 'isVerified' | 'isActive' | 'role'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string | null;
  public lastName!: string | null;
  public username!: string;
  public birthDate?: Date | null;
  public country?: string | null;
  public city?: string | null;
  public profileImage?: string | null;
  public bio?: string | null;
  public totalDistance!: number;
  public totalRaces!: number;
  public wins!: number;
  public personalBest5k?: number | null;
  public personalBest10k?: number | null;
  public personalBestHalfMarathon?: number | null;
  public personalBestMarathon?: number | null;
  public isVerified!: boolean;
  public isActive!: boolean;
  public lastLogin?: Date | null;
  public role!: 'user' | 'admin' | 'moderator';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public toJSON(): any {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.createdAt;
    delete values.updatedAt;
    return values;
  }

  public getPublicProfile(): any {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      profileImage: this.profileImage,
      country: this.country,
      city: this.city,
      bio: this.bio,
      totalDistance: this.totalDistance,
      totalRaces: this.totalRaces,
      wins: this.wins,
      personalBest5k: this.personalBest5k,
      personalBest10k: this.personalBest10k,
      personalBestHalfMarathon: this.personalBestHalfMarathon,
      personalBestMarathon: this.personalBestMarathon,
      isVerified: this.isVerified,
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalDistance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalRaces: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    personalBest5k: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    personalBest10k: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    personalBestHalfMarathon: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    personalBestMarathon: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['country']
      },
      {
        fields: ['totalDistance']
      }
    ]
  }
);

export default User;