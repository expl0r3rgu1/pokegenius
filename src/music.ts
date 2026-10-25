export function makeMusicBuffer(context: AudioContext): AudioBuffer {
  const tempo = 0.3;
  const notes = [
    64, 67, 71, 76, 74, 71, 67, 62, 64, 69, 72, 76, 74, 72, 69, 67, 62, 67, 71,
    74, 76, 74, 71, 67, 60, 64, 67, 72, 71, 67, 64, 62,
  ];
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * tempo * notes.length),
    context.sampleRate,
  );
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) {
    const time = index / context.sampleRate;
    const noteIndex = Math.min(notes.length - 1, Math.floor(time / tempo));
    const position = (time % tempo) / tempo;
    const envelope =
      Math.min(1, position * 25) * Math.max(0, 1 - position / 0.9);
    const frequency = 440 * 2 ** ((notes[noteIndex] - 69) / 12);
    const wave =
      Math.sin(2 * Math.PI * frequency * time) +
      0.25 * Math.sin(6 * Math.PI * frequency * time);
    const bass =
      Math.sin(
        2 *
          Math.PI *
          (noteIndex < 8
            ? 130.81
            : noteIndex < 16
              ? 110
              : noteIndex < 24
                ? 123.47
                : 130.81) *
          time,
      ) * 0.35;
    samples[index] = (wave + bass) * envelope * 0.018;
  }
  return buffer;
}
