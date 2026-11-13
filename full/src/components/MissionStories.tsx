import Image from 'next/image';

const stories = [
  {
    category: 'The body',
    title: 'Understand what the body is telling you.',
    description: 'Bring heart rate, oxygen saturation, body temperature and dosimeter readings into a personal timeline. Device connections are planned; the current prototype uses demonstration data.',
    image: '/images/crew-health.jpg',
    alt: 'An astronaut performing an ultrasound examination aboard the space station',
  },
  {
    category: 'The routine',
    title: 'See the patterns behind each reading.',
    description: 'Combine sleep, movement, fatigue and mood observations with recorded measurements. Compare changes over time so the crew can prepare informed questions for the mission health team.',
    image: '/images/crew-exercise.jpg',
    alt: 'A NASA astronaut exercising on the space station cycle',
  },
  {
    category: 'The whole picture',
    title: 'Connect the crew to their environment.',
    description: 'Review cabin temperature, pressure, humidity and supply checks alongside personal trends. The proposed workflow supports offline records and later sharing with authorized mission staff.',
    image: '/images/crew-observation.jpg',
    alt: 'An astronaut at the International Space Station cupola',
  },
];

export default function MissionStories() {
  return (
    <section className="project-story" id="project">
      <div className="story-heading" data-reveal>
        <h2>EVERY SIGNAL.<br /><span>A HUMAN STORY.</span></h2>
        <p>From an individual reading to the bigger picture.<br />A crew health platform designed for life on the Moon.</p>
      </div>
      <div className="mission-stories">
        {stories.map(({ category, title, description, image, alt }) => (
          <article className="mission-story" key={category}>
            <div className="mission-story-photo">
              <Image src={image} alt={alt} fill sizes="(max-width: 760px) 88vw, 60vw" />
            </div>
            <div className="mission-story-copy">
              <p className="card-category">{category}</p>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
