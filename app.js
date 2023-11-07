/*
사용한 인텐스 : PRESENCE INTENT, SERVER MEMBERS INTENT, MESSAGE CONTENT INTENT
사용된 모듈 : discord.js^@14.13.0, fs, (@discordjs/rest, @discordjs/builders, @discordjs/voice)
추가할 내용 : /help 만들기, 키워드 / 팔로우 유져를 지정해서 하나씩 없앨 수 있도록 하기, (관리자 전용으로, 누가 누구를 팔로우했는지 체크할 수 있도록 하기), 민트초코 라떼 한 모금 추가하기

제작자 : 시현님 (Discord : chiarasihyeon)
언어 : node.js (javascript)

심심해서 그냥 끄적였습니다.서버의 알림을 끄기, mention만으로 해두는 경우가 종종 있는데, 그 경우 자신이 받고 싶은 내용의 알림 또한 오지 않아, 기존에 카카오톡에 있는 키워드 알림 기능에서 영감을 얻어 제작하게 되었습니다.
기존 카카오톡처럼, 키워드 감지 시 봇의 DM으로 해당 메시지 내용, 작성자, 메시지 다이렉트 링크의 정보를 제공해줍니다.
( 주의!! 봇이 관리자 전용 채널 또는 특정 / 불특정 다수가 보면 안되는 채널에 액세스할 수 있는 권한을 가지면 그 메시지의 내용 또한 키워드를 인식 시 무관련한 인원에게 전송할 수가 있습니다.봇에게 권한을 주는 것을 자제해 주세요. )
모든 메시지는 ephemeral 메시지로 나갑니다.현재 이 봇은 호스팅으로는 작동하지 않습니다.
감사합니다.
*/
const { Client, Intents, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebSocketShardDestroyRecovery, Integration, cleanCodeBlockContent } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // 2^0
        GatewayIntentBits.GuildMessages, // 2^9
        GatewayIntentBits.GuildMessageReactions, // 2^10
        GatewayIntentBits.MessageContent, // 2^15
        GatewayIntentBits.GuildVoiceStates, // 2^7 // To Binary ~~ 2진법 이용한 인텐스 구분, Bits 단위, Gateway 바이너리 요청 ~~ discord dev portal => get require
    ],
});
const { REST } = require('@discordjs/rest'); // rest api
const { Routes } = require('discord-api-types/v10'); // routes
const { SlashCommandBuilder } = require('@discordjs/builders'); // v14 넘어오면서 패키지가 discord.js 안에 포함되도록 변경됨.주의 바람
const { joinVoiceChannel } = require('@discordjs/voice'); // 보이스 채널 관련
const { MessageActionRow } = require('discord.js'); // 메시지액션 버튼 관련
const { MessageButton } = require('discord.js'); // 버튼 관련
const { ComponentType } = require('discord.js'); // 버튼 관련
const fs = require('fs'); // fs, json 내보내기 관련

const token = '**********************************************'; // 토큰 키
const clientId = '*******************'; // 클라이언트 ID

client.on('message', function(user, userID, channelID, message, event) {}); // 메시지 인텐스 ~~ ? 

client.on('ready', () => { // 시작할 때
    try {
        const jsonf = fs.readFileSync('userdb.json', 'utf-8'); // userdb.json을 가져오고
        userdb = JSON.parse(jsonf); // 가져온 데이터는 현재의 userdb에 덮어쓴다.
        console.log('유져 데이터 불러오기 성공.\n');
    } catch (error) {
        console.log('유져 데이터 불러오기 실패.에러 : ' + error + '\n');
    }
    client.user.setPresence({ // 
        status: 'online', // 온라인 상태
        activities: [{
            name: '메시지 검사', // 상태 메시지
            type: 0, // 0 = 플레이 중
            details: '하는 중...', // 상세 정보
            state: '???', // 상태
            url: 'https://playeternalreturn.com/main?hl=ko-KR', // 링크
            //assets: {}, // 에셋
            timestamps: {
                start: 0,
                end: 6000000000,
            }, // 시작 및 종료 시간 설정 가능
            party: {
                id: 'ae488379-351d-4a4f-ad32-2b9b01c91657',
                size: [1, 10]
            }, // 파티 정보 설정 가능
            secrets: {}, // 비밀 정보 설정 가능
        }, ],
    });
    console.log(`${client.user.tag}에서 로그인되었습니다.\n`);
    (async() => {
        try {
            console.log('빗금 명령어 등록 중...');
            await rest.put( // rest 를 이용해
                Routes.applicationCommands(clientId), // 클라이언트 아이디로 글로벌 커맨드 등록
                { body: commands }
            );
            console.log('등록 완료!');
        } catch (error) {
            console.error('등록 실패, 에러 사항 : ', error);
        }
    })();
});

/*let userdb = [{
    ID: '744128936375615529',
    guildID: '970957978977062912',
    word: [
        'ㅇㅂㅇ',
        'ㅇㅅㅇ',
    ],
    user: [
        '6514',
        // ID 형식
    ],
}, ];*/
let userdb = [];

function detectword(word, content) { // 단어를 감지해서, 들어있으면 true, 아니면 false 리턴하는 boolen 리턴 함수

    for (let i = 0; i < word.length; i++) {
        const regex = new RegExp(word[i]);//정규식 자동 생성
        if (regex.test(content)) { // 정규식을 만족하는가?
            return true;
        }
    }
    return false;
};

function jsonpost() { // json 형태로 내보내는 함수, 같은 코드를 명령어마다 찍기 귀찮아서 함수로 적어놓음.
    try {
        const datafilePath = 'userdb.json'; // 데이터파일 경로
        const postdata = JSON.stringify(userdb); // 내보낼 데이터를 string화해서 저장
        fs.writeFileSync(datafilePath, postdata); // 그 데이터를 json으로 데이터파일 경로에 저장
    } catch (error) {
        console.log('데이터 이전 실패, 에러 : ' + error);
    }
};

client.on('messageCreate', async(message) => {
    const content = message.content; // 메시지 내용
    const author = message.author.id; // 메시지 작성자
    const guildID = message.guild.id; // 메시지 발송된 길드의 ID


    userdb.forEach(async(userdb) => { // userdb 각각 검사 시작
        //console.log(JSON.stringify(userdb) + '\n------\n');
        let alerttype = '';
        const wordbool = ((detectword(userdb.word, content) && userdb.guildID == guildID)); // T / F 감지인데, 키워드가 포함되는가?
        const userbool = (userdb.guildID == guildID && userdb.user.includes(author)); // T / F 감지인데, 팔로우한 유져의 메시지인가? ( 둘 다 등록된 길드 상에서만 동작하도록 처리해둠, &&사용 )
        if (wordbool) {
            alerttype += '키워드 알림';
        }
        if (userbool) {
            alerttype += '팔로우 유져 알림';
        }
        if (wordbool || userbool) { // 하나라도 만족하면
            if (wordbool && userbool) {
                alerttype = '키워드 / 팔로우 유져 알림';
            }
            try{
            const user = await client.users.fetch(userdb.ID); // 유져DB의 ID 바탕으로 fetch
            const dmChannel = await user.createDM(); // DM 채널 생성
            await dmChannel.send(`${alerttype}\n${await client.users.fetch(author)}님이 메시지를 보내셨습니다.메시지 내용 : ` + '```' + content + '```\n메시지 바로가기 : ' + message.url); // DM 발송
            }
            catch(error){
                console.log(`DM 발송에 실패했습니다.사유 : ${error}`);
            }
        }
    })

});

const commands = [
    new SlashCommandBuilder()
    .setName('follow')
    .setDescription('팔로우할 유져를 설정합니다.길드당 최대 3명까지만 가능합니다.')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('팔로우할 유져')
        .setRequired(true)),
    new SlashCommandBuilder()
    .setName('keyword')
    .setDescription('팔로우할 키워드를 설정합니다.길드당 최대 3개까지만 가능합니다.')
    .addStringOption(option =>
        option.setName('keyword')
        .setDescription('키워드')
        .setRequired(true)),
    new SlashCommandBuilder()
    .setName('followcheck')
    .setDescription('팔로우 목록을 표시합니다.'),
    new SlashCommandBuilder()
    .setName('followreset')
    .setDescription('이 길드에서의 팔로잉 유져를 모두 초기화합니다.'),
    new SlashCommandBuilder()
    .setName('wordreset')
    .setDescription('이 길드에서의 키워드를 모두 초기화합니다.'),
].map(command => command.toJSON()); // 커맨드 목록, 설명은 각각 description 참고

const rest = new REST({ version: '10' }).setToken(token); // discord.js v14가 되면서, rest가 v10을 지원함.

client.on('interactionCreate', async(interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) { // 버튼 인터랙션 or 명령어 인터랙션 이 2개만 따질거임
        return;
    }
    const { commandName, options } = interaction; // 정의하기

    if (commandName === 'follow') { // 유져 팔로우
        const user = options.getMember('user'); // 유져 옵션에 따라 객체 지정
        const arryes = userdb.findIndex(userdb => userdb.ID == interaction.user.id && userdb.guildID == interaction.guildId); // 그 유져, 길드 전부 일치하는 기록이 있는가?있다면 그 인덱스를 리턴받음, 없으면 -1
        if (interaction.guildId != null) { // DM 채널에서는 guildId가 null로 표기됨, DM 채널 감지
            if (arryes != -1) { // 있음?
                if ((userdb[arryes].user).length < 3) { // 맥스 등록 갯수를 3으로 할 거임.너무 커지면 감당할 수가 없음.
                    const yet = userdb[arryes].user.includes(user.id); // 중복 체크
                    if (!yet) { // 중복 아님
                        userdb[arryes].user.push(user.id); // 객체 내 배열에 push
                        const message = await interaction.reply({ content: `${(await client.users.fetch(user)).globalName} 님을 팔로우합니다.\n현재 팔로잉 : ${(userdb[arryes].user).length}명`, ephemeral: true });
                    } else { // 중복임
                        const message = await interaction.reply({ content: `이미 ${(await client.users.fetch(user)).globalName}을 팔로잉 중입니다!`, ephemeral: true });
                    }
                } else { // 이미 3개 넣음
                    const message = await interaction.reply({ content: `이미 이 길드에서 팔로워를 ${userdb[arryes].user.length}명 등록했습니다!`, ephemeral: true });

                }
            } else { // 없으면, 처음부터 객체 형식 지정해주기
                userdb.push({
                    ID: interaction.user.id,
                    guildID: interaction.guildId,
                    word: [

                    ],
                    user: [
                        user.id,
                    ],
                });
                const message = await interaction.reply({ content: `${(await client.users.fetch(user)).globalName} 님을 팔로우합니다.\n현재 팔로잉 : ${(userdb[userdb.length - 1].user).length}명`, ephemeral: true });
            }
        } else { // guildId == null, DM채널일 때.
            const message = interaction.reply({ content: 'DM 채널에서는 이용할 수 없습니다!' });
        }
        jsonpost(); // json 내보내기
    } else if (commandName === 'keyword') { // 키워드 설정
        const keyword = options.getString('keyword'); // string, 명령어에서 키워드를 입력받음
        const arryes = userdb.findIndex(userdb => userdb.ID == interaction.user.id && userdb.guildID == interaction.guildId); // 길드 ID, 유져 ID 있는가?있으면 인덱스를, 없으면 -1 리턴.
        if (interaction.guildId != null) { // DM채널 감지
            if (arryes != -1) { // 있음.
                if ((userdb[arryes].word).length < 3) { // 이미 3개 들어왔는가?
                    const yet = userdb[arryes].word.includes(keyword); // 키워드가 중복인가?(NOT 게이트)
                    if (!yet) { // 중복 아님
                        userdb[arryes].word.push(keyword); // push
                        const message = await interaction.reply({ content: `"${keyword}"에 DM을 받습니다.\n현재 등록된 키워드 : ${(userdb[arryes].word).length}개`, ephemeral: true });
                    } else { // 중복임
                        const message = await interaction.reply({ content: `이미 ${keyword}를 키워드로 등록했습니다!`, ephemeral: true });
                    }
                } else { // 이미 3개 들어있음
                    const message = await interaction.reply({ content: `이미 이 길드에서 키워드를 ${userdb[arryes].word.length}개 등록했습니다!`, ephemeral: true });
                }
            } else { // -1 리턴받음, 형식 처음부터 지정해주기
                userdb.push({
                    ID: interaction.user.id,
                    guildID: interaction.guildId,
                    word: [
                        keyword,
                    ],
                    user: [

                    ],
                });
                const message = await interaction.reply({ content: `"${keyword}"에 DM을 받습니다.\n현재 등록된 키워드 : ${(userdb[userdb.length - 1].word).length}개`, ephemeral: true });
            }
        } else { // DM 채널임
            const message = interaction.reply({ content: 'DM 채널에서는 이용할 수 없습니다!' });
        }
        jsonpost(); // json 내보내기
    } else if (commandName === 'followcheck') { // follow, keyword 체크하기
        const arryes = userdb.findIndex(userdb => userdb.ID == interaction.user.id && userdb.guildID == interaction.guildId); // userdb에서 길드 / 유져 일치하는거 찾기
        if (arryes != -1) { // 있으면
            const userlen = userdb[arryes].user.length; // 팔로우한 유져 수 리턴, 없으면 0(False) 리턴
            let userstr = '';
            if (userlen) { // 팔로우 전부 가져오기
                for (let i = 0; i < userlen; i++) {
                    userstr += (await client.users.fetch(userdb[arryes].user[i])).globalName;
                    if (i < userlen) {
                        userstr += ', ';
                    }
                }
            } else {
                userstr = '이 서버에서 팔로잉중인 유져가 없습니다!';
            }
            const wordlen = userdb[arryes].word.length; // 키워드 수 리턴, 없으면 0(False) 리턴
            let wordstr = '';
            if (wordlen) {
                for (let i = 0; i < wordlen; i++) {
                    wordstr += userdb[arryes].word[i];
                    if (i < userlen) {
                        wordstr += ', ';
                    }
                }
            } else {
                wordstr = '이 서버에서 설정한 키워드가 없습니다!';
            }
            const message = await interaction.reply({ content: '현재 팔로잉중인 유져 목록 : ```' + userstr + '```현재 설정한 키워드 목록 : ```' + wordstr + '```', ephemeral: true });
        } else { // 등록을 하나도 하지 않았을 때
            const message = await interaction.reply({ content: '현재 이 서버에서 키워드 / 팔로잉 유져를 아무것도 등록하지 않았습니다.', ephemeral: true });
        }
        jsonpost(); // json 내보내기
    } else if (commandName === 'followreset') { // 팔로우 리셋
        const arryes = userdb.findIndex(userdb => userdb.ID == interaction.user.id && userdb.guildID == interaction.guildId); // 인덱스 찾기
        if (arryes != -1) { // 있으면

            userdb[arryes].user = []; // 바로 거기 배열 리셋
            const message = await interaction.reply({ content: `팔로잉을 초기화했습니다.`, ephemeral: true });

        } else { // 없으면 ㅋㅋ ㅈㅅ
            const message = await interaction.reply({ content: `이미 초기 상태입니다!`, ephemeral: true });
        }
        jsonpost(); // json 내보내기
    } else if (commandName === 'wordreset') { // 키워드 리셋
        const arryes = userdb.findIndex(userdb => userdb.ID == interaction.user.id && userdb.guildID == interaction.guildId); // 찾고
        if (arryes != -1) { // 있으면

            userdb[arryes].word = []; // 거기 키워드 배열 리셋
            const message = await interaction.reply({ content: `키워드를 초기화했습니다.`, ephemeral: true });

        } else { // 없으면 ㅋㅋ ㅈㅅ
            const message = await interaction.reply({ content: `이미 초기 상태입니다!`, ephemeral: true });
        }
        jsonpost(); // json 내보내기
    }

});

client.login(token);
