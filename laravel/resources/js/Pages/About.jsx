import AppLayout from '../Layouts/AppLayout';

export default function About({ founderBioFr, founderBioEn }) {
    return (
        <AppLayout>
            <section className="py-12 container mx-auto px-4 max-w-3xl">
                <h1 className="text-3xl font-bold mb-6">À propos</h1>
                <p className="text-gray-600 leading-relaxed">Wonder Tours and Services — plus de 20 ans d'expertise touristique au Bénin, au Togo et au Ghana.</p>
                {founderBioFr && <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: founderBioFr }} />}
            </section>
        </AppLayout>
    );
}
