
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Alice B.",
    role: "Marketing Manager",
    quote: "LinkSpark's QR generator is incredibly easy to use and the customization options are fantastic! It saved us so much time for our recent campaign.",
    rating: 5,
    avatar: "https://picsum.photos/100/100?random=10",
    aiHint: "woman portrait",
  },
  {
    name: "Carlos D.",
    role: "Small Business Owner",
    quote: "I love that I can add my logo and brand colors. It makes my QR codes look so much more professional. The local history feature is a lifesaver!",
    rating: 5,
    avatar: "https://picsum.photos/100/100?random=11",
     aiHint: "man portrait",
  },
  {
    name: "Samantha G.",
    role: "Event Planner",
    quote: "Generating QR codes for Wi-Fi access and event schedules has never been simpler. LinkSpark is now my go-to tool.",
    rating: 4,
    avatar: "https://picsum.photos/100/100?random=12",
     aiHint: "woman smiling",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="w-full max-w-6xl text-center space-y-8 px-4 sm:px-0">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Loved by <span className="text-primary">Users Like You</span>
      </h2>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-3xl mx-auto">
        See what people are saying about LinkSpark. (Placeholders)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-4">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="bg-card/60 backdrop-blur-sm border-border/50 text-left flex flex-col animate-fade-in" style={{ animationDelay: `${index * 0.15}s` }}>
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
               <Avatar>
                 <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                 <AvatarFallback>{testimonial.name.substring(0, 1)}</AvatarFallback>
               </Avatar>
               <div>
                 <p className="font-semibold">{testimonial.name}</p>
                 <p className="text-xs text-muted-foreground">{testimonial.role}</p>
               </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
                  />
                ))}
              </div>
              <blockquote className="text-sm text-foreground/90 italic border-l-2 border-primary pl-3">
                "{testimonial.quote}"
              </blockquote>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
