function calculateCompatibility(user1Artists, user2Artists) {
  const user1Ids = new Set(user1Artists.map(artist => artist.id));
  const user2Ids = new Set(user2Artists.map(artist => artist.id));

  const sharedIds = [...user1Ids].filter(id => user2Ids.has(id));
  const sharedArtists = user1Artists.filter(artist => sharedIds.includes(artist.id)).map(artist => artist.name);

  const totalArtists = Math.max(user1Ids.size, user2Ids.size);
  const compatibility = totalArtists > 0 ? Math.round((sharedIds.length / totalArtists) * 100) : 0;

  return {
    compatibility,
    shared_artists: sharedArtists
  };
}

module.exports = {
  calculateCompatibility
};