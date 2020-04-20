/** Create shortest unique possible name. Returns null if short name was not found.
 * @example
 * const names = ['2', '2a'];
 * chooseShortestName('2acbed', names.includes); // '2ac'
 * */
export function chooseShortestName(
  longName: string,
  nameExists: (name: string) => boolean,
) {
  if (longName.length === 0)
    throw Error('chooseShortestName: first argument is an empty string');

  let shortName = '';
  for (let i = 0; i < longName.length; i += 1) {
    shortName += longName[i];
    if (!nameExists(shortName)) return shortName;
  }

  return null;
}
