import Discord from 'discord.js';
import Keys from '../../keys.js';

function createEmbed (content, author) {
    const Embed = new Discord.EmbedBuilder();
    Embed.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true })});
    Embed.setColor(Keys.COLOR);
    Embed.setDescription(content);
    return Embed;
}

export default createEmbed;
