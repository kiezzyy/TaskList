import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const androidProjectRoot = join(repositoryRoot, 'mobile', 'android');
const apkOutputPath = join(androidProjectRoot, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const compatibleJavaHome = findCompatibleJavaHome(process.env.JAVA_HOME) ?? findCompatibleJavaHome();
const compatibleAndroidSdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? findAndroidSdk();

const buildEnvironment = {
  ...process.env,
  JAVA_HOME: compatibleJavaHome,
  ANDROID_HOME: compatibleAndroidSdk ?? undefined
};

if (!buildEnvironment.JAVA_HOME) {
  throw new Error('Unable to find a compatible Java runtime. Install Android Studio JBR or JDK 17-21, then set JAVA_HOME to it.');
}

if (!buildEnvironment.ANDROID_HOME) {
  throw new Error('Unable to find the Android SDK. Set ANDROID_HOME or ANDROID_SDK_ROOT to your SDK directory.');
}

const mobileBuild = spawnSync(...commandInvocation('npm', ['run', 'mobile:build']), {
  cwd: repositoryRoot,
  env: buildEnvironment,
  stdio: 'inherit'
});

if (mobileBuild.error) {
  throw mobileBuild.error;
}

if (mobileBuild.status !== 0) {
  process.exit(mobileBuild.status ?? 1);
}

const apkBuild = spawnSync(...commandInvocation('gradlew', ['assembleDebug']), {
  cwd: androidProjectRoot,
  env: buildEnvironment,
  stdio: 'inherit'
});

if (apkBuild.error) {
  throw apkBuild.error;
}

if (apkBuild.status !== 0) {
  process.exit(apkBuild.status ?? 1);
}

if (existsSync(apkOutputPath)) {
  console.log(`APK ready at ${apkOutputPath}`);
}

function findCompatibleJavaHome(preferredJavaHome = null) {
  const candidateHomes = [
    preferredJavaHome,
    ...getKnownJavaHomes()
  ].filter((candidateHome, index, homes) => Boolean(candidateHome) && homes.indexOf(candidateHome) === index);

  for (const candidateHome of candidateHomes) {
    const majorVersion = readJavaMajorVersion(candidateHome);
    if (majorVersion !== null && majorVersion >= 17 && majorVersion <= 21) {
      return candidateHome;
    }
  }

  return null;
}

function getKnownJavaHomes() {
  return process.platform === 'win32'
    ? [
        'C:\\Program Files\\Android\\Android Studio\\jbr',
        'C:\\Program Files\\Java\\jdk-21',
        'C:\\Program Files\\Java\\jdk-17'
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Android Studio.app/Contents/jbr/Contents/Home']
      : ['/usr/local/android-studio/jbr', '/opt/android-studio/jbr'];

}

function readJavaMajorVersion(javaHome) {
  if (!javaHome || !existsSync(javaHome)) {
    return null;
  }

  const javaExecutable = join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (!existsSync(javaExecutable)) {
    return null;
  }

  const versionProbe = spawnSync(javaExecutable, ['-version'], { encoding: 'utf8' });
  const versionOutput = `${versionProbe.stderr ?? ''}\n${versionProbe.stdout ?? ''}`;
  const versionMatch = versionOutput.match(/version\s+"(?:1\.)?(\d+)/i);
  return versionMatch ? Number(versionMatch[1]) : null;
}

function findAndroidSdk() {
  const candidateHomes = process.platform === 'win32'
    ? [join(homedir(), 'AppData', 'Local', 'Android', 'Sdk')]
    : process.platform === 'darwin'
      ? [join(homedir(), 'Library', 'Android', 'sdk')]
      : [join(homedir(), 'Android', 'Sdk'), '/opt/android-sdk'];

  return candidateHomes.find((candidateHome) => existsSync(candidateHome)) ?? null;
}

function commandInvocation(baseName, commandArguments) {
  if (process.platform !== 'win32') {
    return [baseName === 'gradlew' ? 'bash' : baseName, baseName === 'gradlew' ? ['gradlew', ...commandArguments] : commandArguments];
  }

  if (baseName === 'gradlew') {
    return ['cmd.exe', ['/c', 'gradlew.bat', ...commandArguments]];
  }

  return ['cmd.exe', ['/c', 'npm', ...commandArguments]];
}
