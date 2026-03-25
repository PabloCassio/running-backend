import User from './user.model';
import Race from './race.model';
import RaceParticipation from './raceParticipation.model';

// User has many Races (as organizer)
User.hasMany(Race, {
  foreignKey: 'organizerId',
  as: 'organizedRaces'
});

// Race belongs to User (organizer)
Race.belongsTo(User, {
  foreignKey: 'organizerId',
  as: 'organizer'
});

// User has many RaceParticipations
User.hasMany(RaceParticipation, {
  foreignKey: 'userId',
  as: 'raceParticipations'
});

// Race has many RaceParticipations
Race.hasMany(RaceParticipation, {
  foreignKey: 'raceId',
  as: 'participations'
});

// RaceParticipation belongs to User
RaceParticipation.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// RaceParticipation belongs to Race
RaceParticipation.belongsTo(Race, {
  foreignKey: 'raceId',
  as: 'race'
});

// User has many Races through RaceParticipations
User.belongsToMany(Race, {
  through: RaceParticipation,
  foreignKey: 'userId',
  otherKey: 'raceId',
  as: 'participatedRaces'
});

// Race has many Users through RaceParticipations
Race.belongsToMany(User, {
  through: RaceParticipation,
  foreignKey: 'raceId',
  otherKey: 'userId',
  as: 'participants'
});

export { User, Race, RaceParticipation };