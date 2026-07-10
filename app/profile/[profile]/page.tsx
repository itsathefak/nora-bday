import { HeroBanner } from "../../../components/HeroBanner";
import { ContentRow } from "../../../components/ContentRow";
import { MediaCard } from "../../../components/MediaCard";
import { profiles } from "../../../lib/profiles";
import { getProfileData } from "../../../lib/profileData";
import type { ProfileId } from "../../../lib/profiles";

interface ProfilePageProps {
  params: {
    profile: string;
  };
}

function getProfileId(profile: string): ProfileId | null {
  const found = profiles.find((item) => item.id === profile);
  return found ? found.id : null;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const profileId = getProfileId(params.profile);

  if (!profileId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-center justify-center px-5 py-10 text-center text-slate-300">
        <h1 className="text-3xl font-semibold text-white">Profile not found</h1>
        <p className="mt-4 max-w-xl text-sm">
          We couldn’t find that profile. Head back to the selection screen and
          choose a valid NoraFlix profile.
        </p>
      </div>
    );
  }

  const profileData = getProfileData(profileId);
  const profileMeta = profiles.find((profile) => profile.id === profileId)!;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col gap-10 px-5 py-10 md:px-8">
      <HeroBanner
        title={profileData.hero.title}
        description={profileData.hero.description}
      />

      <div className="grid gap-8">
        {profileData.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <ContentRow title={section.title}>
              {section.items.map((item) => (
                <MediaCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  image={item.poster}
                  href={`/watch/${profileId}/${item.id}`}
                />
              ))}
            </ContentRow>
          </section>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300 shadow-glow">
        <p>
          Viewing profile:{" "}
          <span className="font-semibold text-white">{profileMeta.name}</span>
        </p>
      </div>
    </div>
  );
}
