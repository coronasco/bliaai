import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/shared/Navbar";
import { 
  FaRoad, 
  FaBrain, 
  FaTrophy, 
  FaGraduationCap,
  FaUsers,
  FaChartLine,
  FaStar,
  FaArrowRight 
} from "react-icons/fa";

export default function Home() {
  return (
    <>
      <Navbar isLandingPage={true} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50 to-white -z-10"></div>
        <div className="absolute w-full h-full -z-10">
          <div className="absolute right-0 top-1/3 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute left-0 bottom-1/4 w-96 h-96 bg-indigo-400 rounded-full opacity-10 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 px-3 py-1 text-sm">
              AI-Powered Education Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              Accelerate Your Career Journey With AI
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              BLia AI creates personalized learning paths tailored to your career goals, 
              helping you develop the skills that matter most in today&apos;s job market.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 px-8 text-lg" asChild>
                <Link href="/auth?register=true">
                  Get Started Free <FaArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" className="py-6 px-8 text-lg border-gray-300" asChild>
                <Link href="/paths">
                  Explore Paths
                </Link>
              </Button>
            </div>
            
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 mt-16 text-center">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">500+</p>
                <p className="text-gray-600">Learning Paths</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">15k+</p>
                <p className="text-gray-600">Active Learners</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">98%</p>
                <p className="text-gray-600">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by Advanced AI Technology</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with educational expertise to deliver 
              a personalized learning experience that adapts to your needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaRoad className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Generated Career Paths</h3>
              <p className="text-gray-600">
                Get personalized career roadmaps based on your goals, skills, and industry trends.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaBrain className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">Personalized Learning</h3>
              <p className="text-gray-600">
                Content adapts to your learning style, pace, and existing knowledge.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaGraduationCap className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">School Lessons</h3>
              <p className="text-gray-600">
                Access specialized educational content that complements traditional learning.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaTrophy className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">Gamification</h3>
              <p className="text-gray-600">
                Stay motivated with points, badges, and leaderboards as you progress.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaUsers className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">Community Learning</h3>
              <p className="text-gray-600">
                Connect with peers, share insights, and learn collaboratively.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center mb-6">
                <FaChartLine className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold mb-4">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your advancement with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How BLia AI Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform uses advanced algorithms to create a tailored learning journey that evolves with you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">1</div>
              <h3 className="text-xl font-bold mb-4 pt-2">Create Your Profile</h3>
              <p className="text-gray-600 mb-4">
                Share your career goals, skills, and learning preferences to help our AI understand your needs.
              </p>
              <div className="text-blue-600 font-medium">
                <Link href="/auth?register=true" className="flex items-center">
                  Get Started <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">2</div>
              <h3 className="text-xl font-bold mb-4 pt-2">Generate Your Roadmap</h3>
              <p className="text-gray-600 mb-4">
                Our AI creates a customized career roadmap with specific paths and learning resources.
              </p>
              <div className="text-blue-600 font-medium">
                <Link href="/paths" className="flex items-center">
                  Explore Paths <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">3</div>
              <h3 className="text-xl font-bold mb-4 pt-2">Track Your Progress</h3>
              <p className="text-gray-600 mb-4">
                Complete lessons, earn points, and watch your skills develop as you progress.
              </p>
              <div className="text-blue-600 font-medium">
                <Link href="/premium" className="flex items-center">
                  Unlock Premium <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals who have transformed their careers with BLia AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} className="text-yellow-400 h-5 w-5" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;BLia AI helped me advance from junior to senior developer in just 8 months. The AI-generated roadmap was exactly what I needed.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">JD</div>
                <div className="ml-3">
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-gray-500">Software Developer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} className="text-yellow-400 h-5 w-5" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The personalized learning approach helped me fill gaps in my knowledge that I didn&apos;t even know existed. Incredibly valuable tool.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">AS</div>
                <div className="ml-3">
                  <p className="font-medium">Alice Smith</p>
                  <p className="text-sm text-gray-500">UX Designer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} className="text-yellow-400 h-5 w-5" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The gamification elements kept me motivated to complete my learning paths. I&apos;ve recommended BLia AI to everyone in my team.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">RJ</div>
                <div className="ml-3">
                  <p className="font-medium">Robert Johnson</p>
                  <p className="text-sm text-gray-500">Product Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join BLia AI today and start your personalized learning journey.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 py-6 px-8 text-lg" asChild>
              <Link href="/auth?register=true">
                Create Free Account <FaArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/paths" className="text-gray-600 hover:text-blue-600">Career Paths</Link></li>
                <li><Link href="/dashboard/school" className="text-gray-600 hover:text-blue-600">School Lessons</Link></li>
                <li><Link href="/premium" className="text-gray-600 hover:text-blue-600">Premium Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                <li><Link href="/blog" className="text-gray-600 hover:text-blue-600">Blog</Link></li>
                <li><Link href="/faq" className="text-gray-600 hover:text-blue-600">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@blia-ai.com" className="text-gray-600 hover:text-blue-600">support@blia-ai.com</a></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-blue-600">Contact Form</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-4 md:mb-0">
              BLia AI
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BLia AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
